/**
 * Die Rechner der Seite. Jede Zahl kommt aus params-2026.json über die reinen Funktionen von engine/pfaendung.ts.
 * Eine Spec listet ihre Felder (sichtbar zuerst, `adv` eingeklappt) und eine Funktion `run`, die die Ergebniskarte
 * liefert. Beträge aus der amtlichen Tabelle behalten ihre Cent (RECETTE §4.1 : barème officiel), abgeleitete
 * Größen (Dauer, Summen über Monate) werden ganzzahlig gezeigt.
 */
import type { ToolSpec, V, ToolOut, Opt } from './tool-types';
import { resolve } from './tool-types';
import { formatMoney, formatNumber, displayDate, type Lang } from './format';
import * as E from './engine/pfaendung';
import P from '../data/params-2026.json';
import { LAST_UPDATED } from '../data/site-config';

export type Args = Record<string, number | string>;
const T = (l: Lang, de: string, en: string) => (l === 'de' ? de : en);
const n = (v: V, k: string) => Number(v[k]) || 0;
const s = (v: V, k: string) => String(v[k] ?? '');
const eur = (x: number, l: Lang) => formatMoney(x, 0, l);
const eur2 = (x: number, l: Lang) => formatMoney(x, Number.isInteger(Math.round(x * 100) / 100) ? 0 : 2, l);
const day = (iso: string, l: Lang) => displayDate(iso, l === 'de' ? 'de-DE' : 'en-GB');
const wday = (iso: string, l: Lang) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(l === 'de' ? 'de-DE' : 'en-GB', { weekday: 'long', timeZone: 'UTC' });
const D0 = LAST_UPDATED;

const personenOpts = (l: Lang): Opt[] => [0, 1, 2, 3, 4, 5].map((p) => ({ value: String(p), label: p === 0 ? T(l, 'Keine', 'None') : p === 5 ? T(l, '5 oder mehr', '5 or more') : String(p) }));
const personenIn = (l: Lang, a?: Args, id = 'personen') => ({ kind: 'select' as const, id, label: T(l, 'Unterhaltspflichten (Personen)', 'People you support by law'), def: String(a?.[id] ?? 0), options: personenOpts(l), help: T(l, 'Ehegatte, Kinder, Eltern, denen Sie tatsächlich Unterhalt leisten', 'Spouse, children or parents you actually pay maintenance to') });
const periodeOpts = (l: Lang) => [{ value: 'monat', label: T(l, 'Monat', 'Month') }, { value: 'woche', label: T(l, 'Woche', 'Week') }, { value: 'tag', label: T(l, 'Tag', 'Day') }];
const perLabel = (p: E.Periode, l: Lang) => ({ monat: T(l, 'monatlich', 'per month'), woche: T(l, 'wöchentlich', 'per week'), tag: T(l, 'täglich', 'per day') })[p];
const jahrOpts = (l: Lang) => [{ value: '2026', label: T(l, 'ab 1. Juli 2026', 'from 1 July 2026') }, { value: '2025', label: T(l, '1. Juli 2025 bis 30. Juni 2026', '1 July 2025 to 30 June 2026') }];
const quelle = (j: E.TabJahr, l: Lang) => { const x = E.tabelleInfo(j); return T(l, `Pfändungsfreigrenzenbekanntmachung ${j}, ${x.fundstelle}, gültig ${day(x.gilt_ab, l)} bis ${day(x.gilt_bis, l)}.`, `Exemption-limit notice ${j}, Federal Law Gazette ${x.fundstelle.replace('BGBl. ', '').replace('Nr.', 'No.')}, valid ${day(x.gilt_ab, l)} to ${day(x.gilt_bis, l)}.`); };
const quoteText = (q: number, l: Lang) => T(l, `${formatNumber(q * 10, 0, l)}/10 des Betrags über dem Freibetrag`, `${formatNumber(q * 10, 0, l)}/10 of the amount above the allowance`);

/* ------------------------------------------------------------------ Pfändungsrechner (Hauptrechner) */
function rechnerSpec(l: Lang, a?: Args): ToolSpec {
  const q = String(a?.quelle ?? 'lohn');
  const nettoLabel = q === 'rente' ? T(l, 'Nettorente (Auszahlung)', 'Net pension paid out') : T(l, 'Nettolohn (pfändbares Netto)', 'Net pay (attachable net)');
  return {
    inputs: [
      { id: 'netto', label: nettoLabel, def: Number(a?.netto ?? 2500), unit: '€', max: 100000, decimals: 2, help: q === 'rente' ? T(l, 'Nach Kranken- und Pflegeversicherung', 'After health and care insurance') : T(l, 'Nach Steuern und Sozialabgaben', 'After tax and social contributions') },
      personenIn(l, a),
      { kind: 'choice', id: 'periode', label: T(l, 'Auszahlung pro', 'Paid per'), def: String(a?.periode ?? 'monat'), options: periodeOpts(l) },
      { kind: 'select', id: 'jahr', label: T(l, 'Tabelle', 'Table'), def: String(a?.jahr ?? '2026'), options: jahrOpts(l), adv: true },
    ],
    run: (v) => {
      const per = s(v, 'periode') as E.Periode, j = s(v, 'jahr') as E.TabJahr;
      const r = E.pfaendbar(n(v, 'netto'), n(v, 'personen'), per, j);
      return {
        label: T(l, `Pfändbarer Betrag ${perLabel(per, l)}`, `Attachable amount ${perLabel(per, l)}`),
        value: eur2(r.pfaendbar, l),
        sub: r.pfaendbar === 0 ? T(l, `Unter der Pfändungsfreigrenze: Pfändbar wird erst ab ${eur2(E.pfaendbarAb(r.personen, per, j), l)} netto.`, `Below the exemption limit: nothing is attachable below ${eur2(E.pfaendbarAb(r.personen, per, j), l)} net.`) : T(l, `Ihnen bleiben ${eur2(r.unpfaendbar, l)}.`, `You keep ${eur2(r.unpfaendbar, l)}.`),
        rows: [
          [T(l, 'Bleibt Ihnen (unpfändbar)', 'You keep (exempt)'), eur2(r.unpfaendbar, l), r.unpfaendbar],
          [T(l, 'Geht an den Gläubiger', 'Goes to the creditor'), eur2(r.pfaendbar, l), r.pfaendbar],
          [T(l, 'Zeile der amtlichen Tabelle', 'Row of the official table'), `${eur2(r.stufe, l)} – ${eur2(r.stufeBis, l)}`],
          [T(l, 'Grundfreibetrag mit Unterhaltspflichten', 'Basic allowance with dependants'), eur2(r.freibetrag, l)],
          [T(l, 'Pfändbar davon', 'Attachable share'), quoteText(r.quote, l)],
          ...(r.ueberHoechst > 0 ? [[T(l, 'Über dem Höchstbetrag, voll pfändbar', 'Above the ceiling, fully attachable'), eur2(r.ueberHoechst, l)] as [string, string]] : []),
        ],
        note: quelle(j, l),
      };
    },
  };
}

/* ------------------------------------------------------------------ Pfändungstabelle zum Nachschlagen */
function tabelleSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto', label: T(l, 'Nettoeinkommen', 'Net income'), def: Number(a?.netto ?? 2500), unit: '€', max: 100000, decimals: 2 },
      { kind: 'choice', id: 'periode', label: T(l, 'Tabelle für', 'Table for'), def: String(a?.periode ?? 'monat'), options: periodeOpts(l) },
      { kind: 'select', id: 'jahr', label: T(l, 'Gültigkeit', 'Valid'), def: String(a?.jahr ?? '2026'), options: jahrOpts(l) },
      personenIn(l, a),
    ],
    run: (v) => {
      const per = s(v, 'periode') as E.Periode, j = s(v, 'jahr') as E.TabJahr, p = n(v, 'personen');
      const r = E.pfaendbar(n(v, 'netto'), p, per, j);
      const w = E.werte(j, per);
      const start = Math.max(0, r.stufe - 3 * w.stufe);
      const rows = E.tabellenZeilen(start, 10, per, j);
      return {
        label: T(l, 'Pfändbar laut Tabelle', 'Attachable per the table'), value: eur2(r.pfaendbar, l),
        sub: T(l, `Zeile ${eur2(r.stufe, l)} bis ${eur2(r.stufeBis, l)}, Spalte ${p === 5 ? '5 und mehr' : p} Unterhaltspflichten.`, `Row ${eur2(r.stufe, l)} to ${eur2(r.stufeBis, l)}, column ${p === 5 ? '5 or more' : p} dependants.`),
        rows: [
          [T(l, 'Tabellenschritt', 'Table step'), eur2(w.stufe, l)],
          [T(l, 'Pfändbar ab (keine Unterhaltspflicht)', 'Attachable from (no dependants)'), eur2(E.pfaendbarAb(0, per, j), l)],
          [T(l, 'Voll pfändbar über', 'Fully attachable above'), eur2(w.hoechst, l)],
        ],
        table: {
          caption: T(l, `Ausschnitt der amtlichen Tabelle (${perLabel(per, l)}), pfändbarer Betrag nach Unterhaltspflichten`, `Extract of the official table (${perLabel(per, l)}), attachable amount by number of dependants`),
          headers: [T(l, 'Netto von – bis', 'Net from – to'), '0', '1', '2', '3', '4', T(l, '5+', '5+')],
          rows: rows.map((z) => [`${eur2(z.von, l)} – ${eur2(z.bis, l)}`, ...z.werte.map((x) => (x === 0 ? '–' : eur2(x, l)))].map((c, i) => (i > 0 && z.von === r.stufe ? `<strong>${c}</strong>` : c))),
          align: ['l', 'r', 'r', 'r', 'r', 'r', 'r'],
        },
        note: quelle(j, l),
      };
    },
  };
}

/* ------------------------------------------------------------------ 2025 gegen 2026 */
function vergleichSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 2200), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
    ],
    run: (v) => {
      const a5 = E.pfaendbar(n(v, 'netto'), n(v, 'personen'), 'monat', '2025'), a6 = E.pfaendbar(n(v, 'netto'), n(v, 'personen'), 'monat', '2026');
      const diff = a5.pfaendbar - a6.pfaendbar;
      return {
        label: T(l, 'Seit 1. Juli 2026 bleibt Ihnen mehr', 'Since 1 July 2026 you keep'), value: `${diff >= 0 ? '+' : ''}${eur2(diff, l)}`,
        sub: T(l, 'Unterschied beim unpfändbaren Betrag zwischen beiden Tabellen.', 'Difference in the exempt amount between both tables.'),
        rows: [
          [T(l, 'Pfändbar bis 30. Juni 2026', 'Attachable until 30 June 2026'), eur2(a5.pfaendbar, l), a5.pfaendbar],
          [T(l, 'Pfändbar ab 1. Juli 2026', 'Attachable from 1 July 2026'), eur2(a6.pfaendbar, l), a6.pfaendbar],
          [T(l, 'Freibetrag 2025 / 2026', 'Allowance 2025 / 2026'), `${eur2(a5.freibetrag, l)} / ${eur2(a6.freibetrag, l)}`],
          [T(l, 'Mehr im Jahr (12 Monate)', 'More per year (12 months)'), eur(diff * 12, l)],
        ],
        note: `${quelle('2025', l)} ${quelle('2026', l)}`,
      };
    },
  };
}

/* ------------------------------------------------------------------ Annahme für die Tabelle 2027 */
function prognoseSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'prozent', label: T(l, 'Ihre Annahme: Anstieg zum 1. Juli 2027', 'Your assumption: rise on 1 July 2027'), def: Number(a?.prozent ?? 2), unit: '%', max: 10, decimals: 2, help: T(l, 'Keine amtliche Zahl: Die Bekanntmachung 2027 ist noch nicht erschienen.', 'Not an official figure: the 2027 notice has not been published.') },
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 2500), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
    ],
    run: (v) => {
      const w = E.prognoseWerte(n(v, 'prozent'));
      const heute = E.pfaendbar(n(v, 'netto'), n(v, 'personen'));
      const dann = E.pfaendbarMit(w, n(v, 'netto'), n(v, 'personen'));
      return {
        label: T(l, 'Pfändbar nach Ihrer Annahme', 'Attachable under your assumption'), value: eur2(dann, l),
        sub: T(l, `Heute (Tabelle 2026): ${eur2(heute.pfaendbar, l)}. Rechenbeispiel, keine amtliche Tabelle.`, `Today (2026 table): ${eur2(heute.pfaendbar, l)}. Worked example, not an official table.`),
        rows: [
          [T(l, 'Grundfreibetrag angenommen', 'Assumed basic allowance'), eur2(w.grund, l)],
          [T(l, 'Erste unterhaltsberechtigte Person', 'First dependant'), eur2(w.erste, l)],
          [T(l, 'Zweite bis fünfte Person, je', 'Second to fifth dependant, each'), eur2(w.weitere, l)],
          [T(l, 'Höchstbetrag', 'Ceiling'), eur2(w.hoechst, l)],
        ],
        note: T(l, `Gesetzliche Methode nach § 850c Abs. 4 ZPO: Anpassung entsprechend dem Grundfreibetrag des § 32a EStG am 1. Januar 2027 gegenüber dem 1. Januar 2026 (${eur(P.naechsteTabelle.grundfreibetragEStG2026, l)}).`, `Statutory method under section 850c(4) ZPO: adjusted in line with the basic tax allowance of section 32a EStG on 1 January 2027 compared with 1 January 2026 (${eur(P.naechsteTabelle.grundfreibetragEStG2026, l)}).`),
      };
    },
  };
}

/* ------------------------------------------------------------------ Pfändungsfreigrenze */
function grenzeSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      personenIn(l, a),
      { id: 'netto', label: T(l, 'Ihr Nettolohn im Monat', 'Your net pay per month'), def: Number(a?.netto ?? 1800), unit: '€', max: 100000, decimals: 2 },
    ],
    run: (v) => {
      const p = n(v, 'personen');
      const ab = E.pfaendbarAb(p, 'monat');
      const abstand = ab - n(v, 'netto');
      return {
        label: T(l, 'Pfändungsfreigrenze im Monat', 'Monthly exemption limit'), value: eur2(ab, l),
        sub: abstand > 0 ? T(l, `Ihr Netto liegt ${eur2(abstand, l)} darunter: Es wird nichts gepfändet.`, `Your net pay is ${eur2(abstand, l)} below it: nothing is garnished.`) : T(l, `Ihr Netto liegt ${eur2(-abstand, l)} darüber: pfändbar sind ${eur2(E.pfaendbar(n(v, 'netto'), p).pfaendbar, l)}.`, `Your net pay is ${eur2(-abstand, l)} above it: ${eur2(E.pfaendbar(n(v, 'netto'), p).pfaendbar, l)} is attachable.`),
        rows: [
          [T(l, 'Freigrenze pro Woche', 'Weekly limit'), eur2(E.pfaendbarAb(p, 'woche'), l)],
          [T(l, 'Freigrenze pro Tag', 'Daily limit'), eur2(E.pfaendbarAb(p, 'tag'), l)],
          [T(l, 'Unpfändbarer Grundbetrag im Monat', 'Exempt basic amount per month'), eur2(E.freibetrag(p), l)],
          [T(l, 'Bis 30. Juni 2026 galt', 'Until 30 June 2026'), eur2(E.pfaendbarAb(p, 'monat', '2025'), l)],
        ],
        note: T(l, 'Die Freigrenze ist die untere Grenze der ersten Tabellenzeile mit einem pfändbaren Betrag; darunter bleibt das ganze Netto.', 'The limit is the lower bound of the first table row with an attachable amount; below it you keep all of your net pay.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Pfändungsfreibetrag */
function freibetragSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      personenIn(l, a),
      { kind: 'choice', id: 'periode', label: T(l, 'Auszahlung pro', 'Paid per'), def: String(a?.periode ?? 'monat'), options: periodeOpts(l) },
    ],
    run: (v) => {
      const per = s(v, 'periode') as E.Periode, p = n(v, 'personen');
      const w = E.werte('2026', per);
      return {
        label: T(l, `Unpfändbarer Grundbetrag ${perLabel(per, l)}`, `Exempt basic amount ${perLabel(per, l)}`), value: eur2(E.freibetrag(p, per), l),
        sub: T(l, `Über diesem Betrag bleiben Ihnen zusätzlich ${formatNumber(10 - E.QUOTEN[Math.min(p, 5)] * 10, 0, l)}/10 des Mehrbetrags.`, `Above it you also keep ${formatNumber(10 - E.QUOTEN[Math.min(p, 5)] * 10, 0, l)}/10 of the excess.`),
        rows: [
          [T(l, 'Grundfreibetrag (§ 850c Abs. 1)', 'Basic allowance (s. 850c(1))'), eur2(w.grund, l)],
          [T(l, 'Erste Person (§ 850c Abs. 2 Satz 1)', 'First dependant (s. 850c(2) sentence 1)'), eur2(w.erste, l)],
          [T(l, 'Zweite bis fünfte Person, je', 'Second to fifth dependant, each'), eur2(w.weitere, l)],
          [T(l, 'P-Konto-Freibetrag im Monat', 'P-account allowance per month'), eur2(E.sockel() + E.pkontoErhoehung(p), l)],
        ],
        table: { headers: [T(l, 'Unterhaltspflichten', 'Dependants'), T(l, 'Freibetrag', 'Allowance'), T(l, 'Pfändbar ab', 'Attachable from')], rows: [0, 1, 2, 3, 4, 5].map((x) => [x === 5 ? T(l, '5 und mehr', '5 or more') : String(x), eur2(E.freibetrag(x, per), l), eur2(E.pfaendbarAb(x, per), l)]), align: ['l', 'r', 'r'] },
        note: quelle('2026', l),
      };
    },
  };
}

/* ------------------------------------------------------------------ pfändbares Netto (§ 850e, § 850a) */
function nettoSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'auszahlung', label: T(l, 'Nettoauszahlung laut Abrechnung', 'Net pay on the payslip'), def: Number(a?.auszahlung ?? 2900), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
      { id: 'ueberstunden', label: T(l, 'Darin: Vergütung für Überstunden', 'Of which: overtime pay'), def: Number(a?.ueberstunden ?? 200), unit: '€', max: 50000, decimals: 2 },
      { id: 'weihnachtsgeld', label: T(l, 'Darin: Weihnachtsgeld', 'Of which: Christmas bonus'), def: Number(a?.weihnachtsgeld ?? 0), unit: '€', max: 50000, decimals: 2 },
      { id: 'urlaubsgeld', label: T(l, 'Darin: übliches Urlaubsgeld', 'Of which: customary holiday bonus'), def: 0, unit: '€', max: 50000, decimals: 2, adv: true },
      { id: 'aufwand', label: T(l, 'Darin: Spesen, Schmutz- und Gefahrenzulagen', 'Of which: expenses, dirt and danger allowances'), def: 0, unit: '€', max: 50000, decimals: 2, adv: true },
    ],
    run: (v) => {
      const x = E.pfaendbaresNetto({ auszahlung: n(v, 'auszahlung'), ueberstunden: n(v, 'ueberstunden'), weihnachtsgeld: n(v, 'weihnachtsgeld'), urlaubsgeld: n(v, 'urlaubsgeld'), aufwand: n(v, 'aufwand') });
      const r = E.pfaendbar(x.netto, n(v, 'personen'));
      return {
        label: T(l, 'Netto für die Pfändungstabelle', 'Net for the garnishment table'), value: eur2(x.netto, l),
        sub: T(l, `Daraus pfändbar: ${eur2(r.pfaendbar, l)}. Ihnen bleiben ${eur2(n(v, 'auszahlung') - r.pfaendbar, l)} der Auszahlung.`, `Attachable from it: ${eur2(r.pfaendbar, l)}. You keep ${eur2(n(v, 'auszahlung') - r.pfaendbar, l)} of the payout.`),
        rows: [
          [T(l, 'Hälfte der Überstundenvergütung', 'Half of the overtime pay'), `− ${eur2(x.freiUeberstunden, l)}`],
          [T(l, `Weihnachtsgeld bis ${eur2(E.weihnachtsFrei(), l)}`, `Christmas bonus up to ${eur2(E.weihnachtsFrei(), l)}`), `− ${eur2(x.freiWeihnachten, l)}`],
          [T(l, 'Urlaubsgeld, Spesen, Zulagen', 'Holiday bonus, expenses, allowances'), `− ${eur2(x.freiUrlaub + x.freiAufwand, l)}`],
          [T(l, 'Pfändbarer Betrag', 'Attachable amount'), eur2(r.pfaendbar, l)],
        ],
        note: T(l, 'Grundlage: § 850a Nr. 1 bis 4 und § 850e Nr. 1 ZPO. Urlaubsgeld und Zulagen nur, soweit sie den Rahmen des Üblichen nicht übersteigen.', 'Basis: section 850a nos. 1 to 4 and section 850e no. 1 ZPO. Holiday bonus and allowances only insofar as they stay within what is customary.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Sonderzahlungen */
function sonderSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'lohn', label: T(l, 'Normales Monatsnetto', 'Normal monthly net'), def: Number(a?.lohn ?? 2300), unit: '€', max: 100000, decimals: 2 },
      { id: 'weihnachtsgeld', label: T(l, 'Weihnachtsgeld netto', 'Christmas bonus, net'), def: Number(a?.weihnachtsgeld ?? 1200), unit: '€', max: 50000, decimals: 2 },
      personenIn(l, a),
      { kind: 'select', id: 'jahr', label: T(l, 'Ausgezahlt im Zeitraum', 'Paid in the period'), def: '2026', options: jahrOpts(l), adv: true },
    ],
    run: (v) => {
      const j = s(v, 'jahr') as E.TabJahr;
      const frei = Math.min(n(v, 'weihnachtsgeld'), E.weihnachtsFrei(j));
      const ohne = E.pfaendbar(n(v, 'lohn'), n(v, 'personen'), 'monat', j).pfaendbar;
      const mit = E.pfaendbar(n(v, 'lohn') + n(v, 'weihnachtsgeld') - frei, n(v, 'personen'), 'monat', j).pfaendbar;
      return {
        label: T(l, 'Unpfändbarer Teil des Weihnachtsgeldes', 'Exempt part of the Christmas bonus'), value: eur2(frei, l),
        sub: T(l, `Vom Weihnachtsgeld gehen ${eur2(mit - ohne, l)} zusätzlich an den Gläubiger.`, `${eur2(mit - ohne, l)} of the bonus goes to the creditor on top.`),
        rows: [
          [T(l, 'Höchstens unpfändbar', 'Exempt at most'), eur2(E.weihnachtsFrei(j), l)],
          [T(l, 'Pfändbar im Monat ohne Weihnachtsgeld', 'Attachable in a month without bonus'), eur2(ohne, l)],
          [T(l, 'Pfändbar im Monat mit Weihnachtsgeld', 'Attachable in the bonus month'), eur2(mit, l)],
        ],
        note: T(l, '§ 850a Nr. 4 ZPO: Hälfte des auf volle 10 Euro aufgerundeten monatlichen Freibetrags. Der Rest kommt zum Netto des Auszahlungsmonats.', 'Section 850a no. 4 ZPO: half of the monthly allowance rounded up to the next 10 euros. The rest is added to the net pay of the month it is paid.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Unterhaltspflichten im Vergleich */
function personenSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 3000), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, { personen: a?.personen ?? 2 }),
    ],
    run: (v) => {
      const r = E.pfaendbar(n(v, 'netto'), n(v, 'personen'));
      const nul = E.pfaendbar(n(v, 'netto'), 0);
      return {
        label: T(l, 'Pfändbar mit Ihren Unterhaltspflichten', 'Attachable with your dependants'), value: eur2(r.pfaendbar, l),
        sub: T(l, `Ohne Unterhaltspflicht wären es ${eur2(nul.pfaendbar, l)}.`, `With no dependants it would be ${eur2(nul.pfaendbar, l)}.`),
        rows: [[T(l, 'Unterschied durch die Unterhaltspflichten', 'Difference made by the dependants'), eur2(nul.pfaendbar - r.pfaendbar, l)], [T(l, 'Freibetrag', 'Allowance'), eur2(r.freibetrag, l)]],
        table: { headers: [T(l, 'Personen', 'People'), T(l, 'Pfändbar', 'Attachable'), T(l, 'Bleibt', 'You keep')], rows: [0, 1, 2, 3, 4, 5].map((p) => { const x = E.pfaendbar(n(v, 'netto'), p); return [p === 5 ? T(l, '5 und mehr', '5 or more') : String(p), eur2(x.pfaendbar, l), eur2(x.unpfaendbar, l)]; }), align: ['l', 'r', 'r'] },
        note: T(l, 'Mitgezählt wird, wem Sie aufgrund gesetzlicher Pflicht tatsächlich Unterhalt gewähren (§ 850c Abs. 2 ZPO). Hat die Person eigenes Einkommen, kann das Gericht sie auf Antrag ganz oder teilweise unberücksichtigt lassen (Abs. 6).', 'Count only people you actually support under a legal duty (section 850c(2) ZPO). If such a person has income of their own, the court may disregard them in whole or in part on application (subsection 6).'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Dauer einer Lohnpfändung */
function dauerSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'schuld', label: T(l, 'Offene Forderung', 'Amount owed'), def: Number(a?.schuld ?? 6000), unit: '€', max: 5000000, decimals: 2 },
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 2600), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
    ],
    run: (v) => {
      const r = E.pfaendbar(n(v, 'netto'), n(v, 'personen'));
      const m = E.laufzeit(n(v, 'schuld'), r.pfaendbar);
      return {
        label: T(l, 'Lohnpfändung läuft etwa', 'The wage garnishment lasts about'), value: m === null ? T(l, 'unbegrenzt', 'no end') : T(l, `${formatNumber(m, 0, l)} Monate`, `${formatNumber(m, 0, l)} months`),
        sub: m === null ? T(l, 'Bei diesem Netto ist nichts pfändbar: Die Forderung wird über den Lohn nicht kleiner.', 'Nothing is attachable at this net pay: the debt does not shrink through your wages.') : T(l, `Das sind rund ${formatNumber(m / 12, 1, l)} Jahre bei gleichbleibendem Lohn.`, `That is about ${formatNumber(m / 12, 1, l)} years at an unchanged wage.`),
        rows: [[T(l, 'Pfändbar im Monat', 'Attachable per month'), eur2(r.pfaendbar, l)], [T(l, 'Ihnen bleiben', 'You keep'), eur2(r.unpfaendbar, l)]],
        note: T(l, 'Ohne Zinsen, Vollstreckungskosten und Lohnänderungen: Die tatsächliche Dauer ist meist länger. Die Tabelle wird jedes Jahr zum 1. Juli angepasst.', 'Without interest, enforcement costs or pay changes: the real duration is usually longer. The table changes every 1 July.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Fristen bei der Lohnpfändung */
function lohnfristSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [{ kind: 'date', id: 'zustellung', label: T(l, 'Beschluss beim Arbeitgeber zugestellt am', 'Order served on the employer on'), def: String(a?.zustellung ?? D0) }],
    run: (v) => {
      const z = s(v, 'zustellung');
      const f = E.fristWochen(z, P.drittschuldnerWochen);
      const tab = E.tabelleAm(z);
      return {
        label: T(l, 'Drittschuldnererklärung spätestens', 'Third-party debtor statement due by'), value: day(f.ende, l),
        sub: T(l, `${wday(f.ende, l)}; zwei Wochen ab Zustellung (§ 840 ZPO)${f.verschoben ? ', verschoben auf den nächsten Werktag' : ''}.`, `${wday(f.ende, l)}; two weeks from service (section 840 ZPO)${f.verschoben ? ', moved to the next working day' : ''}.`),
        rows: [
          [T(l, 'Pfändung wirksam ab', 'Garnishment effective from'), day(z, l)],
          [T(l, 'Anzuwendende Tabelle', 'Table that applies'), T(l, `ab ${day(E.tabelleInfo(tab).gilt_ab, l)}`, `from ${day(E.tabelleInfo(tab).gilt_ab, l)}`)],
          [T(l, 'Nächste Anpassung der Tabelle', 'Next table change'), day(tab === '2026' ? P.naechsteTabelle.gilt_ab : E.tabelleInfo('2026').gilt_ab, l)],
        ],
        note: T(l, 'Mit der Zustellung an den Drittschuldner ist die Pfändung bewirkt (§ 829 Abs. 3 ZPO). Feiertage: nur die bundesweiten werden berücksichtigt.', 'The garnishment takes effect on service to the third-party debtor (section 829(3) ZPO). Holidays: only nationwide ones are taken into account.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Unterhaltspfändung (§ 850d) */
function unterhaltSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 2400), unit: '€', max: 100000, decimals: 2 },
      { id: 'belassen', label: T(l, 'Laut Beschluss belassener Betrag', 'Amount left to you in the order'), def: Number(a?.belassen ?? 1250), unit: '€', max: 100000, decimals: 2, help: T(l, 'Steht im Pfändungsbeschluss; vom Gericht festgesetzt', 'Stated in the garnishment order; set by the court') },
      personenIn(l, a),
    ],
    run: (v) => {
      const norm = E.pfaendbar(n(v, 'netto'), n(v, 'personen'));
      const bleibt = Math.min(n(v, 'belassen'), norm.unpfaendbar, n(v, 'netto'));
      const pf = Math.max(0, n(v, 'netto') - bleibt);
      return {
        label: T(l, 'Pfändbar für den Unterhalt', 'Attachable for maintenance'), value: eur2(pf, l),
        sub: n(v, 'belassen') > norm.unpfaendbar ? T(l, `Der belassene Betrag ist auf ${eur2(norm.unpfaendbar, l)} begrenzt: mehr als nach § 850c darf nicht bleiben.`, `The amount left is capped at ${eur2(norm.unpfaendbar, l)}: you cannot keep more than under section 850c.`) : T(l, `Ihnen bleiben ${eur2(bleibt, l)}.`, `You keep ${eur2(bleibt, l)}.`),
        rows: [[T(l, 'Zum Vergleich: normale Pfändung', 'For comparison: ordinary garnishment'), eur2(norm.pfaendbar, l)], [T(l, 'Mehr für den Unterhaltsgläubiger', 'Extra for the maintenance creditor'), eur2(pf - norm.pfaendbar, l)]],
        note: T(l, 'Den notwendigen Unterhalt setzt das Vollstreckungsgericht im Einzelfall fest (§ 850d Abs. 1 ZPO); der Rechner rechnet nur mit dem Betrag, den Sie aus dem Beschluss eintragen.', 'The enforcement court sets the necessary maintenance case by case (section 850d(1) ZPO); the calculator only uses the figure you enter from the order.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ mehrere Einkommen (§ 850e Nr. 2) */
function mehrereSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto1', label: T(l, 'Hauptjob netto', 'Main job, net'), def: Number(a?.netto1 ?? 1700), unit: '€', max: 100000, decimals: 2 },
      { id: 'netto2', label: T(l, 'Zweites Einkommen netto', 'Second income, net'), def: Number(a?.netto2 ?? 600), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
    ],
    run: (v) => {
      const p = n(v, 'personen');
      const g1 = E.pfaendbar(n(v, 'netto1'), p).pfaendbar, g2 = E.pfaendbar(n(v, 'netto2'), p).pfaendbar;
      const zus = E.pfaendbar(n(v, 'netto1') + n(v, 'netto2'), p).pfaendbar;
      return {
        label: T(l, 'Pfändbar nach Zusammenrechnung', 'Attachable once combined'), value: eur2(zus, l),
        sub: T(l, `Getrennt gerechnet wären es ${eur2(g1 + g2, l)}.`, `Calculated separately it would be ${eur2(g1 + g2, l)}.`),
        rows: [[T(l, 'Hauptjob allein', 'Main job alone'), eur2(g1, l)], [T(l, 'Zweites Einkommen allein', 'Second income alone'), eur2(g2, l)], [T(l, 'Mehr durch Zusammenrechnung', 'Extra from combining'), eur2(zus - g1 - g2, l)]],
        note: T(l, 'Zusammengerechnet wird nur auf Antrag durch das Vollstreckungsgericht (§ 850e Nr. 2 ZPO); der Grundfreibetrag wird dann dem Haupteinkommen entnommen.', 'Incomes are only combined when the enforcement court orders it on application (section 850e no. 2 ZPO); the basic allowance is then taken from the main income.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Selbstständige (§ 850i) */
function selbstSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'betrag', label: T(l, 'Gepfändete Zahlung (nach Steuern und Vorsorge)', 'Garnished payment (after tax and provision)'), def: Number(a?.betrag ?? 6000), unit: '€', max: 5000000, decimals: 2 },
      { id: 'monate', label: T(l, 'Davon leben Sie wie viele Monate?', 'How many months must it last?'), def: Number(a?.monate ?? 3), max: 24 },
      personenIn(l, a),
    ],
    run: (v) => {
      const m = Math.max(1, Math.round(n(v, 'monate')));
      const proMonat = n(v, 'betrag') / m;
      const r = E.pfaendbar(proMonat, n(v, 'personen'));
      return {
        label: T(l, 'Orientierung: Ihnen bliebe', 'Benchmark: you would keep'), value: eur(r.unpfaendbar * m, l),
        sub: T(l, `Das sind ${eur2(r.unpfaendbar, l)} im Monat, wie bei einem Lohn von ${eur(proMonat, l)}.`, `That is ${eur2(r.unpfaendbar, l)} a month, as for wages of ${eur(proMonat, l)}.`),
        rows: [[T(l, 'Pro Monat gerechnet', 'Per month'), eur(proMonat, l)], [T(l, 'Pfändbar nach Tabelle', 'Attachable per table'), eur(r.pfaendbar * m, l)]],
        note: T(l, 'Bei Einkünften, die kein laufender Lohn sind, belässt das Gericht nur auf Antrag einen Betrag „nach freier Schätzung“ (§ 850i ZPO). Die Tabelle ist dafür ein Maßstab, kein Anspruch.', 'For income that is not a regular wage, the court only leaves an amount on application, at its own estimate (section 850i ZPO). The table is a benchmark for that, not an entitlement.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Bedarf über dem Freibetrag (§ 850f) */
function bedarfSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'netto', label: T(l, 'Nettolohn im Monat', 'Net pay per month'), def: Number(a?.netto ?? 2600), unit: '€', max: 100000, decimals: 2 },
      { id: 'bedarf', label: T(l, 'Ihr notwendiger Bedarf im Monat', 'Your necessary needs per month'), def: Number(a?.bedarf ?? 2100), unit: '€', max: 100000, decimals: 2, help: T(l, 'Regelbedarf und Wohnkosten laut Bescheid oder Berechnung', 'Standard needs and housing costs per a notice or calculation') },
      personenIn(l, a),
    ],
    run: (v) => {
      const r = E.pfaendbar(n(v, 'netto'), n(v, 'personen'));
      const luecke = n(v, 'bedarf') - r.unpfaendbar;
      return {
        label: luecke > 0 ? T(l, 'Fehlbetrag zum notwendigen Bedarf', 'Shortfall against necessary needs') : T(l, 'Bedarf gedeckt, Rest', 'Needs covered, margin'), value: eur2(Math.abs(luecke), l),
        sub: luecke > 0 ? T(l, 'Ein Antrag nach § 850f Abs. 1 ZPO kann sich lohnen: Belegen Sie den Bedarf beim Vollstreckungsgericht.', 'An application under section 850f(1) ZPO may be worth it: prove the needs to the enforcement court.') : T(l, 'Der unpfändbare Betrag deckt den eingetragenen Bedarf.', 'The exempt amount covers the needs you entered.'),
        rows: [[T(l, 'Bleibt nach der Tabelle', 'Left after the table'), eur2(r.unpfaendbar, l)], [T(l, 'Pfändbar nach der Tabelle', 'Attachable per the table'), eur2(r.pfaendbar, l)]],
        note: T(l, 'Ob und wie viel mehr bleibt, entscheidet das Gericht; überwiegende Belange des Gläubigers dürfen nicht entgegenstehen.', 'The court decides whether and how much more you keep; it must not conflict with overriding interests of the creditor.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ P-Konto-Freibetrag */
function pkontoSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      personenIn(l, a),
      { id: 'kinder', label: T(l, 'Kinder, für die Sie Kindergeld bekommen', 'Children you receive child benefit for'), def: Number(a?.kinder ?? 0), max: 15 },
      { id: 'sozial', label: T(l, 'Weitere geschützte Leistungen im Monat', 'Other protected benefits per month'), def: 0, unit: '€', max: 100000, decimals: 2, adv: true, help: T(l, 'z. B. Leistungen für Mitbewohner der Bedarfsgemeinschaft, Pflegegeld', 'e.g. benefits for others in your household unit, care allowance') },
      { id: 'sgb2', label: T(l, 'Eigene Leistung nach SGB II oder XII im Monat', 'Your own SGB II or XII benefit per month'), def: 0, unit: '€', max: 100000, decimals: 2, adv: true },
      { kind: 'select', id: 'jahr', label: T(l, 'Zeitraum', 'Period'), def: '2026', options: jahrOpts(l), adv: true },
    ],
    run: (v) => {
      const j = s(v, 'jahr') as E.TabJahr;
      const x = E.pkontoFrei({ personen: n(v, 'personen'), kinder: n(v, 'kinder'), sozial: n(v, 'sozial'), sgb2: n(v, 'sgb2'), jahr: j });
      return {
        label: T(l, 'Geschützt auf dem P-Konto im Monat', 'Protected on the P-account per month'), value: eur2(x.gesamt, l),
        sub: x.gesamt > x.sockel ? T(l, 'Über dem Sockel nur mit Bescheinigung nach § 903 ZPO.', 'Above the base amount only with a certificate under section 903 ZPO.') : T(l, 'Diesen Sockelbetrag schützt die Bank automatisch.', 'The bank protects this base amount automatically.'),
        rows: [
          [T(l, 'Sockelbetrag (§ 899 Abs. 1)', 'Base amount (s. 899(1))'), eur2(x.sockel, l), x.sockel],
          [T(l, 'Unterhaltspflichten (§ 902 Nr. 1)', 'Dependants (s. 902 no. 1)'), eur2(x.personen, l), x.personen],
          [T(l, 'Kindergeld (§ 902 Nr. 5)', 'Child benefit (s. 902 no. 5)'), eur2(x.kindergeld, l), x.kindergeld],
          [T(l, 'Weitere Leistungen', 'Other benefits'), eur2(x.sozial + x.sgb2Mehr, l), x.sozial + x.sgb2Mehr],
        ],
        note: T(l, `Kindergeld ${eur(P.kindergeld, l)} je Kind (§ 66 EStG). ${quelle(j, l)}`, `Child benefit ${eur(P.kindergeld, l)} per child (section 66 EStG). ${quelle(j, l)}`),
      };
    },
  };
}

/* ------------------------------------------------------------------ P-Konto-Freibeträge 2025 und 2026 */
function pkontoTabSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [personenIn(l, a), { id: 'kinder', label: T(l, 'Kinder mit Kindergeld', 'Children with child benefit'), def: Number(a?.kinder ?? 0), max: 15 }],
    run: (v) => {
      const x6 = E.pkontoFrei({ personen: n(v, 'personen'), kinder: n(v, 'kinder') }), x5 = E.pkontoFrei({ personen: n(v, 'personen'), kinder: n(v, 'kinder'), jahr: '2025' });
      return {
        label: T(l, 'P-Konto-Freibetrag ab 1. Juli 2026', 'P-account allowance from 1 July 2026'), value: eur2(x6.gesamt, l),
        sub: T(l, `Bis 30. Juni 2026 waren es ${eur2(x5.gesamt, l)}.`, `Until 30 June 2026 it was ${eur2(x5.gesamt, l)}.`),
        rows: [[T(l, 'Sockel 2026 / 2025', 'Base 2026 / 2025'), `${eur2(x6.sockel, l)} / ${eur2(x5.sockel, l)}`], [T(l, 'Aufstockung Personen', 'Top-up for dependants'), eur2(x6.personen, l)], [T(l, 'Kindergeld', 'Child benefit'), eur2(x6.kindergeld, l)]],
        table: { headers: [T(l, 'Unterhaltspflichten', 'Dependants'), T(l, 'ab 1.7.2026', 'from 1.7.2026'), T(l, '1.7.2025 bis 30.6.2026', '1.7.2025 to 30.6.2026')], rows: [0, 1, 2, 3, 4, 5].map((p) => [p === 5 ? T(l, '5 und mehr', '5 or more') : String(p), eur2(E.sockel('2026') + E.pkontoErhoehung(p, '2026'), l), eur2(E.sockel('2025') + E.pkontoErhoehung(p, '2025'), l)]), align: ['l', 'r', 'r'] },
        note: T(l, 'Ohne Kindergeld und sonstige Leistungen; diese kommen hinzu.', 'Without child benefit and other benefits; those come on top.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Termine beim Einrichten des P-Kontos */
function pfristSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { kind: 'date', id: 'antrag', label: T(l, 'Umwandlung bei der Bank verlangt am', 'Conversion requested at the bank on'), def: String(a?.antrag ?? D0) },
      { kind: 'date', id: 'zustellung', label: T(l, 'Pfändung der Bank zugestellt am', 'Garnishment served on the bank on'), def: String(a?.zustellung ?? '2026-10-20') },
    ],
    run: (v) => {
      const an = s(v, 'antrag'), zu = s(v, 'zustellung');
      const wirksam = E.geschaeftstagNach(an, P.pkonto.umwandlungGeschaeftstag);
      const rueck = E.fristMonate(zu, P.pkonto.umwandlungRueckwirkendMonate);
      const rechtzeitig = an <= rueck.ende;
      return {
        label: T(l, 'P-Konto-Schutz gilt ab', 'P-account protection applies from'), value: day(wirksam, l),
        sub: rechtzeitig ? T(l, `Rechtzeitig: Die Umwandlung wirkt auf die Pfändung vom ${day(zu, l)} zurück (§ 899 Abs. 1 Satz 2 ZPO).`, `In time: the conversion applies back to the garnishment of ${day(zu, l)} (section 899(1) sentence 2 ZPO).`) : T(l, `Zu spät für die Rückwirkung: Die Monatsfrist endete am ${day(rueck.ende, l)}.`, `Too late to apply backwards: the one-month period ended on ${day(rueck.ende, l)}.`),
        rows: [
          [T(l, 'Beginn des vierten Geschäftstags', 'Start of the fourth business day'), `${wday(wirksam, l)}, ${day(wirksam, l)}`],
          [T(l, 'Umwandeln mit Rückwirkung bis', 'Convert with backdating by'), day(rueck.ende, l)],
          [T(l, 'Bank zahlt frühestens aus am', 'Bank pays the creditor at the earliest on'), day(E.fristMonate(zu, P.kontopfaendung.wartefristMonate).roh, l)],
        ],
        note: T(l, 'Geschäftstage: Montag bis Freitag ohne bundesweite Feiertage. Ab dem vierten Geschäftstag nach dem Verlangen wird das Konto als P-Konto geführt (§ 850k Abs. 2 ZPO).', 'Business days: Monday to Friday without nationwide holidays. From the fourth business day after the request the account runs as a P-account (section 850k(2) ZPO).'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Bescheinigung (§ 903) */
function bescheinigungSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { kind: 'date', id: 'vorlage', label: T(l, 'Bescheinigung der Bank vorgelegt am', 'Certificate handed to the bank on'), def: String(a?.vorlage ?? D0) },
      personenIn(l, { personen: a?.personen ?? 1 }),
      { id: 'kinder', label: T(l, 'Kinder mit Kindergeld', 'Children with child benefit'), def: Number(a?.kinder ?? 1), max: 15 },
    ],
    run: (v) => {
      const vo = s(v, 'vorlage');
      const ab = E.geschaeftstagNach(vo, P.pkonto.bescheinigungGeschaeftstag);
      const x = E.pkontoFrei({ personen: n(v, 'personen'), kinder: n(v, 'kinder') });
      const bis = E.addDays(E.fristMonate(vo, 12 * P.pkonto.bescheinigungJahre).roh, 0);
      return {
        label: T(l, 'Höherer Freibetrag gilt ab', 'Higher allowance applies from'), value: day(ab, l),
        sub: T(l, `Neuer Freibetrag: ${eur2(x.gesamt, l)} im Monat statt ${eur2(x.sockel, l)}.`, `New allowance: ${eur2(x.gesamt, l)} a month instead of ${eur2(x.sockel, l)}.`),
        rows: [[T(l, 'Zweiter Geschäftstag nach Vorlage', 'Second business day after handing in'), `${wday(ab, l)}`], [T(l, 'Unbefristete Bescheinigung gilt bis etwa', 'Open-ended certificate holds until about'), day(bis, l)], [T(l, 'Mehr als der Sockel', 'Above the base amount'), eur2(x.gesamt - x.sockel, l)]],
        note: T(l, 'Ausstellen dürfen Familienkasse, Sozialleistungsträger, Arbeitgeber und anerkannte Schuldnerberatungsstellen (§ 903 Abs. 1 ZPO). Unbefristete Bescheinigungen beachtet die Bank zwei Jahre (§ 903 Abs. 2).', 'Certificates may come from the family benefits office, a social benefits agency, the employer or a recognised debt advice body (section 903(1) ZPO). The bank honours open-ended certificates for two years (section 903(2)).'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Übertrag in Folgemonate (§ 899 Abs. 2) */
function uebertragSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'frei', label: T(l, 'Ihr Freibetrag im Monat', 'Your monthly allowance'), def: Number(a?.frei ?? E.sockel()), unit: '€', max: 100000, decimals: 2 },
      { id: 'eingang', label: T(l, 'Gutschrift jeden Monat', 'Credit every month'), def: Number(a?.eingang ?? 1590), unit: '€', max: 100000, decimals: 2 },
      { id: 'aus1', label: T(l, 'Ausgaben Monat 1', 'Spending month 1'), def: Number(a?.aus1 ?? 1100), unit: '€', max: 100000, decimals: 2 },
      { id: 'aus2', label: T(l, 'Ausgaben Monat 2', 'Spending month 2'), def: Number(a?.aus2 ?? 1300), unit: '€', max: 100000, decimals: 2 },
      { id: 'aus3', label: T(l, 'Ausgaben Monat 3', 'Spending month 3'), def: 1590, unit: '€', max: 100000, decimals: 2, adv: true },
      { id: 'aus4', label: T(l, 'Ausgaben Monat 4', 'Spending month 4'), def: 2000, unit: '€', max: 100000, decimals: 2, adv: true },
    ],
    run: (v) => {
      const r = E.uebertrag(n(v, 'frei'), [1, 2, 3, 4].map((k) => ({ eingang: n(v, 'eingang'), ausgaben: n(v, `aus${k}`) })));
      const pf = r.reduce((x, m) => x + m.pfaendbar, 0);
      return {
        label: T(l, 'Nach Monat 2 übertragen', 'Carried over after month 2'), value: eur2(r[1].uebertrag, l),
        sub: pf > 0 ? T(l, `In vier Monaten wären ${eur2(pf, l)} pfändbar.`, `${eur2(pf, l)} would be attachable over four months.`) : T(l, 'In den vier Monaten bleibt alles geschützt.', 'Everything stays protected over the four months.'),
        rows: r.map((m) => [T(l, `Monat ${m.monat}: verfügbar geschützt`, `Month ${m.monat}: protected available`), eur2(m.geschuetzt, l)] as [string, string]),
        table: { headers: [T(l, 'Monat', 'Month'), T(l, 'Guthaben', 'Balance'), T(l, 'Ausgegeben', 'Spent'), T(l, 'Übertrag', 'Carried'), T(l, 'Pfändbar', 'Attachable')], rows: r.map((m) => [String(m.monat), eur2(m.guthaben, l), eur2(m.verfuegt, l), eur2(m.uebertrag, l), eur2(m.pfaendbar, l)]), align: ['l', 'r', 'r', 'r', 'r'] },
        note: T(l, 'Vereinfachtes Modell von § 899 Abs. 2 ZPO: Nicht verbrauchter Freibetrag bleibt drei Folgemonate geschützt, Ausgaben werden mit dem ältesten Guthaben verrechnet. Die Wartefrist nach § 900 ZPO ist nicht abgebildet.', 'Simplified model of section 899(2) ZPO: unused allowance stays protected for the three following months, spending is set against the oldest balance first. The waiting period under section 900 ZPO is not modelled.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Fristen der Kontopfändung */
function kfristSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { kind: 'date', id: 'zustellung', label: T(l, 'Pfändungs- und Überweisungsbeschluss der Bank zugestellt am', 'Garnishment and transfer order served on the bank on'), def: String(a?.zustellung ?? D0), wide: true },
      { kind: 'choice', id: 'pkonto', label: T(l, 'Ist das Konto schon ein P-Konto?', 'Is the account already a P-account?'), def: String(a?.pkonto ?? 'nein'), options: [{ value: 'ja', label: T(l, 'Ja', 'Yes') }, { value: 'nein', label: T(l, 'Nein', 'No') }] },
    ],
    run: (v) => {
      const z = s(v, 'zustellung');
      const frist = E.fristMonate(z, P.kontopfaendung.wartefristMonate);
      const ist = s(v, 'pkonto') === 'ja';
      return {
        label: ist ? T(l, 'Freibetrag geschützt, Bank zahlt Überschuss frühestens', 'Allowance protected, bank pays any excess at the earliest') : T(l, 'In ein P-Konto umwandeln bis', 'Convert to a P-account by'), value: day(frist.ende, l),
        sub: ist ? T(l, `Den Freibetrag von ${eur(E.sockel(), l)} im Monat schützt die Bank ohne Antrag.`, `The bank protects the ${eur(E.sockel(), l)} monthly allowance without any request.`) : T(l, 'Bis dahin umgewandelt, gilt der Schutz rückwirkend ab der Pfändung (§ 899 Abs. 1 Satz 2 ZPO).', 'Converted by then, protection applies back to the date of the garnishment (section 899(1) sentence 2 ZPO).'),
        rows: [
          [T(l, 'Pfändung erfasst Guthaben ab', 'Garnishment covers balances from'), day(z, l)],
          [T(l, 'Bank zahlt an den Gläubiger frühestens nach', 'Bank pays the creditor at the earliest after'), day(frist.roh, l)],
          [T(l, 'Einwände gegen den Freibetrag eines Monats bis', 'Objections to one month’s allowance by'), day(E.monatsendeNach(z, P.pkonto.einwendungMonate), l)],
          [T(l, 'Fristende verschoben (Wochenende, Feiertag)', 'Deadline moved (weekend, holiday)'), frist.verschoben ? T(l, 'ja', 'yes') : T(l, 'nein', 'no')],
        ],
        note: T(l, 'Einen Monat nach Zustellung des Überweisungsbeschlusses darf die Bank leisten (§ 835 Abs. 3 Satz 2 ZPO). Fristende nach § 188 BGB und § 222 Abs. 2 ZPO, bundesweite Feiertage.', 'The bank may pay one month after the transfer order is served (section 835(3) sentence 2 ZPO). End of period per section 188 BGB and section 222(2) ZPO, nationwide holidays.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Nachzahlungen (§ 904) */
function nachzahlungSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'betrag', label: T(l, 'Nachgezahlter Betrag', 'Back-payment received'), def: Number(a?.betrag ?? 900), unit: '€', max: 1000000, decimals: 2 },
      { id: 'monate', label: T(l, 'Für wie viele Monate?', 'Covering how many months?'), def: Number(a?.monate ?? 3), max: 60 },
      { id: 'sonst', label: T(l, 'Sonstige Gutschriften in diesen Monaten (je Monat)', 'Other credits in those months (per month)'), def: Number(a?.sonst ?? 1400), unit: '€', max: 100000, decimals: 2 },
      { id: 'frei', label: T(l, 'Ihr Freibetrag im Monat', 'Your monthly allowance'), def: Number(a?.frei ?? E.sockel()), unit: '€', max: 100000, decimals: 2, adv: true },
    ],
    run: (v) => {
      const r = E.nachzahlung(n(v, 'betrag'), n(v, 'monate'), n(v, 'frei'), n(v, 'sonst'));
      return {
        label: T(l, 'Von der Nachzahlung geschützt', 'Protected part of the back-payment'), value: eur2(r.geschuetzt, l),
        sub: r.regel === 'grenze' ? T(l, `Bis ${eur(P.pkonto.nachzahlungGrenze, l)} ist eine Nachzahlung ganz geschützt (§ 904 Abs. 2 ZPO).`, `Up to ${eur(P.pkonto.nachzahlungGrenze, l)} a back-payment is fully protected (section 904(2) ZPO).`) : T(l, 'Über 500 Euro wird Monat für Monat geprüft (§ 904 Abs. 3 ZPO); festgesetzt wird das vom Vollstreckungsgericht.', 'Above 500 euros it is checked month by month (section 904(3) ZPO); the enforcement court sets the amount.'),
        rows: [[T(l, 'Anteil je Monat', 'Share per month'), eur2(r.proMonat, l)], [T(l, 'Möglicherweise pfändbar', 'Possibly attachable'), eur2(r.pfaendbar, l)]],
        note: T(l, 'Gilt für laufende Sozialleistungen und Arbeitseinkommen. Leistungen nach SGB II, XII, AsylbLG und Kindergeld sind bei Nachzahlung ohne Betragsgrenze geschützt (§ 904 Abs. 1 ZPO).', 'Applies to recurring social benefits and earned income. SGB II and XII benefits, asylum seeker benefits and child benefit are protected with no cap when paid late (section 904(1) ZPO).'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Was ist pfändbar ? */
type Art = { de: string; en: string; st: 'frei' | 'lohn' | 'bedingt' | 'unterhalt' | 'teil' };
const ARTEN: Record<string, Art> = {
  lohn: { de: 'Arbeitslohn, Gehalt, Beamtenbezüge', en: 'Wages, salary, civil-service pay', st: 'lohn' },
  rente: { de: 'Altersrente, Erwerbsminderungsrente', en: 'Old-age or disability pension', st: 'lohn' },
  alg1: { de: 'Arbeitslosengeld I, Krankengeld', en: 'Unemployment benefit I, sickness benefit', st: 'lohn' },
  sgb2: { de: 'Grundsicherungsgeld nach SGB II (früher Bürgergeld)', en: 'Basic income support under SGB II (Grundsicherungsgeld)', st: 'frei' },
  kindergeld: { de: 'Kindergeld', en: 'Child benefit', st: 'unterhalt' },
  wohngeld: { de: 'Wohngeld', en: 'Housing benefit', st: 'frei' },
  elterngeld: { de: 'Elterngeld', en: 'Parental allowance', st: 'teil' },
  weihnachten: { de: 'Weihnachtsgeld', en: 'Christmas bonus', st: 'teil' },
  ueberstunden: { de: 'Überstundenvergütung', en: 'Overtime pay', st: 'teil' },
  mehraufwand: { de: 'Leistungen für Mehraufwand wegen eines Körper- oder Gesundheitsschadens', en: 'Benefits covering extra costs of a disability', st: 'frei' },
  unterhaltsrente: { de: 'Gesetzliche Unterhaltsrente, die Sie erhalten', en: 'Statutory maintenance you receive', st: 'bedingt' },
  blinden: { de: 'Blindenzulage', en: 'Allowance for the blind', st: 'frei' },
};
function unpfaendbarSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [{ kind: 'select', id: 'art', label: T(l, 'Art der Einnahme', 'Type of income'), def: String(a?.art ?? 'kindergeld'), options: Object.entries(ARTEN).map(([k, x]) => ({ value: k, label: l === 'de' ? x.de : x.en })), wide: true }],
    run: (v) => {
      const k = s(v, 'art'), x = ARTEN[k] ?? ARTEN.lohn;
      const txt: Record<Art['st'], [string, string]> = {
        frei: [T(l, 'Unpfändbar', 'Not attachable'), T(l, 'Diese Leistung darf nicht gepfändet werden; auf dem P-Konto kommt sie zum Freibetrag hinzu.', 'This payment cannot be garnished; on a P-account it is added to the allowance.')],
        lohn: [T(l, 'Pfändbar wie Arbeitseinkommen', 'Attachable like earned income'), T(l, 'Es gilt die Pfändungstabelle nach § 850c ZPO mit Ihren Unterhaltspflichten.', 'The garnishment table of section 850c ZPO applies with your dependants.')],
        bedingt: [T(l, 'Nur ausnahmsweise pfändbar', 'Attachable only by exception'), T(l, 'Nur wenn andere Vollstreckung scheitert und es der Billigkeit entspricht, dann wie Lohn (§ 850b Abs. 2 ZPO).', 'Only if other enforcement fails and it is equitable, then like wages (section 850b(2) ZPO).')],
        unterhalt: [T(l, 'Nur für den Unterhalt des Kindes pfändbar', 'Attachable only for the child’s maintenance'), T(l, 'Andere Gläubiger erreichen das Kindergeld nicht (§ 76 EStG, § 54 Abs. 5 SGB I).', 'Other creditors cannot reach child benefit (section 76 EStG, section 54(5) SGB I).')],
        teil: [T(l, 'Teilweise unpfändbar', 'Partly exempt'), k === 'elterngeld' ? T(l, `Bis ${eur(P.elterngeldFrei, l)} im Monat unpfändbar (§ 54 Abs. 3 Nr. 1 SGB I mit § 10 BEEG).`, `Exempt up to ${eur(P.elterngeldFrei, l)} a month (section 54(3) no. 1 SGB I with section 10 BEEG).`) : k === 'weihnachten' ? T(l, `Bis ${eur(E.weihnachtsFrei(), l)} unpfändbar (§ 850a Nr. 4 ZPO).`, `Exempt up to ${eur(E.weihnachtsFrei(), l)} (section 850a no. 4 ZPO).`) : T(l, 'Zur Hälfte unpfändbar (§ 850a Nr. 1 ZPO).', 'Half is exempt (section 850a no. 1 ZPO).')],
      };
      return {
        label: l === 'de' ? x.de : x.en, value: txt[x.st][0], sub: txt[x.st][1],
        rows: [[T(l, 'Unpfändbar insgesamt', 'Fully exempt'), Object.values(ARTEN).filter((y) => y.st === 'frei').length.toString()], [T(l, 'Wie Lohn pfändbar', 'Attachable like wages'), Object.values(ARTEN).filter((y) => y.st === 'lohn').length.toString()]],
        note: T(l, 'Quellen: §§ 850a, 850b ZPO, § 54 SGB I, § 42 Abs. 4 SGB II, § 76 EStG.', 'Sources: sections 850a and 850b ZPO, section 54 SGB I, section 42(4) SGB II, section 76 EStG.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Kindergeld */
function kindergeldSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'kinder', label: T(l, 'Kinder mit Kindergeld', 'Children with child benefit'), def: Number(a?.kinder ?? 2), max: 15 },
      { kind: 'choice', id: 'glaeubiger', label: T(l, 'Wer pfändet?', 'Who is garnishing?'), def: String(a?.glaeubiger ?? 'andere'), options: [{ value: 'andere', label: T(l, 'Anderer Gläubiger', 'Another creditor') }, { value: 'kind', label: T(l, 'Ein Kind (Unterhalt)', 'A child (maintenance)') }] },
    ],
    run: (v) => {
      const k = Math.max(0, Math.floor(n(v, 'kinder'))), kg = k * P.kindergeld;
      const kind = s(v, 'glaeubiger') === 'kind';
      return {
        label: kind ? T(l, 'Höchstens pfändbar für dieses Kind', 'Attachable at most for this child') : T(l, 'Kindergeld geschützt im Monat', 'Child benefit protected per month'), value: eur(kind ? (k > 0 ? P.kindergeld : 0) : kg, l),
        sub: kind ? T(l, 'Pfändbar ist der Anteil, der bei gleicher Verteilung auf dieses Kind entfällt (§ 54 Abs. 5 SGB I).', 'What can be taken is the share that falls to this child when the benefit is split equally (section 54(5) SGB I).') : T(l, 'Auf dem P-Konto kommt das Kindergeld zum Freibetrag hinzu, mit Bescheinigung.', 'On a P-account child benefit is added to the allowance, with a certificate.'),
        rows: [[T(l, 'Kindergeld je Kind', 'Child benefit per child'), eur(P.kindergeld, l)], [T(l, 'Kindergeld insgesamt', 'Total child benefit'), eur(kg, l)], [T(l, 'P-Konto mit Kindergeld (ohne Unterhaltspflichten)', 'P-account with child benefit (no dependants)'), eur2(E.sockel() + kg, l)]],
        note: T(l, 'Grundlage: § 66 und § 76 EStG, § 54 Abs. 5 SGB I, § 902 Satz 1 Nr. 5 ZPO.', 'Basis: sections 66 and 76 EStG, section 54(5) SGB I, section 902 sentence 1 no. 5 ZPO.'),
      };
    },
  };
}

/* ------------------------------------------------------------------ Lohn und Sozialleistung auf dem P-Konto */
function sozialSpec(l: Lang, a?: Args): ToolSpec {
  return {
    inputs: [
      { id: 'sgb2', label: T(l, 'Grundsicherungsgeld (SGB II) für Sie im Monat', 'Your SGB II benefit per month'), def: Number(a?.sgb2 ?? 1100), unit: '€', max: 100000, decimals: 2 },
      { id: 'lohn', label: T(l, 'Gutschrift aus Minijob oder Lohn', 'Credit from a mini-job or wages'), def: Number(a?.lohn ?? 556), unit: '€', max: 100000, decimals: 2 },
      personenIn(l, a),
    ],
    run: (v) => {
      const x = E.pkontoFrei({ personen: n(v, 'personen'), sgb2: n(v, 'sgb2') });
      const ein = n(v, 'sgb2') + n(v, 'lohn');
      const pf = Math.max(0, ein - x.gesamt);
      return {
        label: T(l, 'Pfändbar vom Konto im Monat', 'Attachable from the account per month'), value: eur2(pf, l),
        sub: T(l, `Geschützt: ${eur2(x.gesamt, l)} bei ${eur2(ein, l)} Gutschriften.`, `Protected: ${eur2(x.gesamt, l)} out of ${eur2(ein, l)} credited.`),
        rows: [[T(l, 'Sockelbetrag', 'Base amount'), eur2(x.sockel, l)], [T(l, 'Grundsicherungsgeld über dem Sockel', 'SGB II benefit above the base'), eur2(x.sgb2Mehr, l)], [T(l, 'Unterhaltspflichten', 'Dependants'), eur2(x.personen, l)]],
        note: T(l, 'Der Anspruch auf Grundsicherungsgeld selbst ist unpfändbar (§ 42 Abs. 4 SGB II); auf dem P-Konto ist der Teil über dem Sockel nach § 902 Satz 1 Nr. 4 ZPO geschützt, mit Bescheinigung.', 'The SGB II claim itself cannot be garnished (section 42(4) SGB II); on a P-account the part above the base is protected under section 902 sentence 1 no. 4 ZPO, with a certificate.'),
      };
    },
  };
}

export const SPECS: Record<string, (l: Lang, arg?: Args) => ToolSpec> = {
  rechner: rechnerSpec, tabelle: tabelleSpec, vergleich: vergleichSpec, prognose: prognoseSpec, grenze: grenzeSpec, freibetrag: freibetragSpec,
  netto: nettoSpec, sonder: sonderSpec, personen: personenSpec, dauer: dauerSpec, lohnfrist: lohnfristSpec, unterhalt: unterhaltSpec,
  mehrere: mehrereSpec, selbst: selbstSpec, bedarf: bedarfSpec, pkonto: pkontoSpec, pkontotab: pkontoTabSpec, pfrist: pfristSpec,
  bescheinigung: bescheinigungSpec, uebertrag: uebertragSpec, kfrist: kfristSpec, nachzahlung: nachzahlungSpec, unpfaendbar: unpfaendbarSpec,
  kindergeld: kindergeldSpec, sozial: sozialSpec,
};
export const TOOL_KINDS = Object.keys(SPECS);
export function getTool(kind: string, l: Lang, arg?: Args): ToolSpec {
  const f = SPECS[kind]; if (!f) throw new Error(`simulateur inconnu : ${kind}`);
  return f(l, arg);
}
/** Lance un simulateur avec ses valeurs par défaut (ou celles données) : sert aux pages et aux tests. */
export function runTool(kind: string, l: Lang, arg?: Args, values?: V): ToolOut {
  const spec = getTool(kind, l, arg);
  const v = Object.fromEntries(spec.inputs.map((i) => [i.id, i.def])) as V;
  return spec.run(resolve(spec.inputs, { ...v, ...(values ?? {}) }));
}
export { formatNumber };
