import { defineGuide } from '../../lib/page-types';
import { KIT as K } from '../../lib/kit';
import { formatMoney, formatPercent, displayDate } from '../../lib/format';

/* Pfändungstabelle 2027 : pas encore publiée au 28.10.2026. Mécanisme : § 850c Abs. 4 ZPO (indexation sur le
   Grundfreibetrag du § 32a EStG, version au 1er janvier). Historique vérifié : BGBl. 2024 I Nr. 160, 2025 I Nr. 110, 2026 I Nr. 80. */
type L = 'de' | 'en';
const e2 = (x: number, l: L) => formatMoney(x, Number.isInteger(Math.round(x * 100) / 100) ? 0 : 2, l);
const d = (iso: string, l: L) => displayDate(iso, l === 'de' ? 'de-DE' : 'en-GB');
const pc = (x: number, l: L) => formatPercent(x, 2, l);
const N = K.P.naechsteTabelle;
const T4 = K.P.tabellen['2024'], T5 = K.P.tabellen['2025'], T6 = K.P.tabellen['2026'];
const r45 = T5.monat.grund / T4.monat.grund - 1;
const r56 = T6.monat.grund / T5.monat.grund - 1;
const annahme = 2;
const W = K.prognoseWerte(annahme);
const heute = K.pfaendbar(2800, 1).pfaendbar;
const dann = K.pfaendbarMit(W, 2800, 1);

export default defineGuide({
  id: 'tabelle-2027', group: 'tabelle', order: 2,
  tool: 'prognose',
  related: ['pfaendungstabelle', 'tabelle-2025', 'freibetrag', 'freigrenze', 'p-konto-freibetrag'],
  sources: ['zpo850c', 'estg32a', 'bek2026', 'bek2025'],
  de: {
    slug: 'pfaendungstabelle-2027',
    nav: 'Pfändungstabelle 2027', card: 'Stand der nächsten Tabelle und Ihre eigene Annahme',
    title: 'Pfändungstabelle 2027: Stand Oktober 2026 und Annahme',
    description: 'Pfändungstabelle 2027: noch nicht bekannt gemacht, gilt erst ab 1. Juli 2027. Bis dahin zählt die Tabelle 2026. Methode nach § 850c Abs. 4, Rechner mit Annahme.',
    h1: 'Pfändungstabelle 2027: was feststeht und was noch fehlt',
    intro: 'Die neuen Freibeträge stehen erst im Frühjahr fest. Hier sehen Sie, nach welcher Regel sie steigen, wie stark sie zuletzt gestiegen sind und was eine selbst gewählte Annahme für Ihr Netto bedeuten würde.',
    resume: `Eine Pfändungstabelle 2027 gibt es am ${d(K.LESEDATUM, 'de')} noch nicht: Das Bundesministerium der Justiz hat die Pfändungsfreigrenzenbekanntmachung 2027 nicht veröffentlicht. Fest steht nur der Termin. Die neuen Beträge gelten ab dem ${d(N.gilt_ab, 'de')}, bis zum ${d(T6.gilt_bis, 'de')} bleibt die Tabelle 2026 mit ${e2(T6.monat.grund, 'de')} Grundfreibetrag im Monat maßgeblich. Wie stark die Grenzen steigen, legt § 850c Abs. 4 ZPO fest: Sie folgen der prozentualen Entwicklung des steuerlichen Grundfreibetrags nach § 32a EStG, jeweils in der Fassung vom 1. Januar. Für 2026 lag dieser Grundfreibetrag bei ${e2(N.grundfreibetragEStG2026, 'de')}; der Wert für den 1. Januar 2027 entscheidet über die neue Tabelle. Zuletzt stiegen die Pfändungsgrenzen um ${pc(r56, 'de')} (2026) und um ${pc(r45, 'de')} (2025). Der Rechner auf dieser Seite rechnet mit einem Prozentsatz, den Sie selbst eintragen. Das Ergebnis ist ein Rechenbeispiel, keine amtliche Zahl.`,
    faqs: [
      { q: 'Wann wird die Pfändungstabelle 2027 veröffentlicht?', a: `Einen festen Veröffentlichungstag nennt das Gesetz nicht, nur den Stichtag ${d(N.gilt_ab, 'de')} für die neuen Beträge. Die letzten drei Bekanntmachungen tragen das Datum ${d(T4.datum, 'de')}, ${d(T5.datum, 'de')} und ${d(T6.datum, 'de')}. Sie erschienen also jeweils im Frühjahr, einige Monate vor dem Stichtag. Sobald die Bekanntmachung 2027 im Bundesgesetzblatt steht, übernehmen wir die Werte und prüfen jede Zeile.` },
      { q: 'Kann die Tabelle 2027 auch niedriger ausfallen als 2026?', a: 'Das Gesetz spricht von einer Anpassung entsprechend der prozentualen Entwicklung des steuerlichen Grundfreibetrags. Sinkt dieser Freibetrag nicht, sinken auch die Pfändungsgrenzen nicht. Bleibt er gleich, bleiben auch die Beträge gleich. Bei den beiden letzten Anpassungen, 2025 und 2026, sind alle Beträge gestiegen. Eine Aussage über 2027 lässt sich daraus nicht ableiten, solange der Wert für den 1. Januar 2027 nicht feststeht.' },
      { q: 'Muss ich im Juli 2027 meinem Arbeitgeber etwas mitteilen?', a: `Nein. Der Pfändungsbeschluss verweist auf die Tabelle; nach § 850c Abs. 5 Satz 3 ZPO reicht ein solcher Verweis aus. Ihr Arbeitgeber wendet ab dem Lohnzeitraum, der am ${d(N.gilt_ab, 'de')} beginnt, die neue Tabelle an. Prüfen Sie Ihre erste Abrechnung nach dem Stichtag: Der pfändbare Betrag sollte bei gleichem Netto kleiner geworden sein, wenn die Freibeträge gestiegen sind.` },
      { q: 'Was bedeutet die Annahme im Rechner zur Tabelle 2027?', a: `Sie tragen einen Prozentsatz ein, um den die Beträge steigen könnten. Der Rechner erhöht Grundfreibetrag, Erhöhungsbeträge und Höchstbetrag der Tabelle 2026 um genau diesen Satz und rechnet Ihr Netto damit durch. Mit ${pc(annahme / 100, 'de')} ergibt sich zum Beispiel ein Grundfreibetrag von ${e2(W.grund, 'de')}. Das ist eine Rechenübung mit Ihrer Zahl, keine Vorhersage und keine amtliche Tabelle.` },
    ],
    body: (h) => `
<h2>Die Regel hinter jeder neuen Tabelle</h2>
<p>Die Freibeträge werden nicht frei festgelegt. ${h.src('zpo850c', '§ 850c Abs. 4 ZPO')} schreibt vor, dass das Ministerium drei Gruppen von Beträgen im Bundesgesetzblatt bekannt macht: den unpfändbaren Grundbetrag, die Erhöhungsbeträge für Unterhaltspflichten und den Höchstbetrag, über dem alles pfändbar ist. Alle drei werden zum 1. Juli angepasst, und zwar um denselben Prozentsatz, um den sich der steuerliche Grundfreibetrag im Vergleich zum Vorjahr verändert hat. Maßgeblich ist der Stand am 1. Januar des jeweiligen Jahres.</p>
<p>Für die Tabelle 2027 heißt das: Entscheidend ist der Grundfreibetrag nach ${h.src('estg32a', '§ 32a EStG')}, der am 1. Januar 2027 gilt, im Vergleich zu den ${e2(N.grundfreibetragEStG2026, h.lang)} vom 1. Januar 2026. Diesen Wert für 2027 haben wir in den geprüften Gesetzestexten nicht; wir nennen deshalb keinen Prozentsatz. Ändert der Gesetzgeber den Steuertarif noch, ändert sich mit ihm die Pfändungstabelle. Erst die Bekanntmachung bringt die verbindlichen Zahlen, auf den Cent genau.</p>
<p>Aus den Beträgen ergibt sich dann die Tabelle selbst. Ihre Zeilen sind nicht verhandelbar: Sie entstehen aus dem Freibetrag, den Zehntel-Quoten des § 850c Abs. 3 und der Abrundung auf volle ${e2(T6.monat.stufe, h.lang)} nach Abs. 5. Wer die neuen Freibeträge kennt, kann jede Zeile selbst nachrechnen.</p>
<h2>Wie stark die Grenzen zuletzt gestiegen sind</h2>
<p>Die Beträge dreier Tabellenjahre haben wir mit dem Bundesgesetzblatt abgeglichen. Die Steigerung war nicht jedes Jahr gleich: Zum Juli 2025 stieg der Grundfreibetrag um ${pc(r45, h.lang)}, zum Juli 2026 um ${pc(r56, h.lang)}. Der Höchstbetrag und die Erhöhungsbeträge zogen jeweils im gleichen Verhältnis mit, kleine Unterschiede ergeben sich nur aus der Rundung auf Cent.</p>
${h.table(['Gültig ab', 'Grundfreibetrag', 'Erste Person', 'Je weitere Person', 'Höchstbetrag'].map((x, i) => (h.lang === 'de' ? x : ['Valid from', 'Basic allowance', 'First dependant', 'Each further dependant', 'Ceiling'][i])), (['2024', '2025', '2026'] as const).map((j) => { const t = h.P.tabellen[j]; return [h.day(t.gilt_ab), e2(t.monat.grund, h.lang), e2(t.monat.erste, h.lang), e2(t.monat.weitere, h.lang), e2(t.monat.hoechst, h.lang)]; }), h.lang === 'de' ? 'Monatsbeträge nach § 850c ZPO laut den Bekanntmachungen 2024, 2025 und 2026' : 'Monthly amounts under section 850c ZPO per the 2024, 2025 and 2026 notices', ['l', 'r', 'r', 'r', 'r'])}
<p>Die Werte stammen aus der ${h.src('bek2026', 'Bekanntmachung 2026')} und der ${h.src('bek2025', 'Bekanntmachung 2025')}, die jeweils auch die Vorjahresbeträge nennen. Für Sie zählt am Ende nicht der Prozentsatz, sondern die Zeile, in die Ihr Netto fällt. Wie viel die letzte Erhöhung bei Ihrem Lohn ausgemacht hat, zeigt der Vergleich der beiden geltenden Tabellen.</p>
${h.mini('vergleich', { p: ['netto', 'personen'], d: { netto: 2800, personen: 1 }, c: 'Tabelle 2025 und 2026 vollständig vergleichen' })}
<h2>Rechnen mit einer eigenen Annahme</h2>
<p>Der Rechner oben erhöht alle Beträge der Tabelle 2026 um den Satz, den Sie eintragen, und wendet danach dieselbe Rechnung an wie bei einer echten Tabelle. Ein Beispiel mit ${pc(annahme / 100, h.lang)}, gewählt nur zur Veranschaulichung: Bei ${e2(2800, h.lang)} netto und einer unterhaltsberechtigten Person wären statt ${e2(heute, h.lang)} noch ${e2(dann, h.lang)} pfändbar. Der Grundfreibetrag läge in diesem Beispiel bei ${e2(W.grund, h.lang)}, der Höchstbetrag bei ${e2(W.hoechst, h.lang)}.</p>
<p>Nutzen Sie die Annahme für eine grobe Planung, etwa wenn Sie wissen wollen, ob eine Ratenvereinbarung ab Sommer 2027 noch tragbar ist. Verlassen Sie sich für Ihre Abrechnung aber nur auf die amtliche Tabelle. Bis Ende Juni 2027 rechnet Ihr Arbeitgeber mit der ${h.a('pfaendungstabelle', 'Pfändungstabelle 2026')}.</p>
<p>Die neue Tabelle wirkt auch auf dem Konto. Der Sockel des P-Kontos ist der monatliche Grundfreibetrag, aufgerundet auf volle 10 Euro (§ 899 Abs. 1 ZPO), derzeit ${e2(h.sockel(), h.lang)}. Steigt der Grundfreibetrag im Juli 2027, steigt auch dieser Betrag; Einzelheiten unter ${h.a('p-konto-freibetrag', 'P-Konto-Freibetrag')}.</p>`,
  },
  en: {
    slug: 'garnishment-table-2027',
    nav: 'Garnishment table 2027', card: 'Status of the next German table and your own assumption',
    title: 'Pfändungstabelle 2027: German Table Status in 2026',
    description: 'German garnishment table 2027: not yet published, valid only from 1 July 2027. Until then the 2026 table applies. Legal method plus a calculator for your guess.',
    h1: 'Pfändungstabelle 2027: what is settled and what is not',
    intro: 'The new German exemption limits are only fixed in spring. See the rule that drives them, how much they rose in recent years and what a rate of your own choosing would mean for your net pay.',
    resume: `As of ${d(K.LESEDATUM, 'en')} there is no 2027 garnishment table in Germany yet: the Federal Ministry of Justice has not published the 2027 exemption-limit notice (Pfändungsfreigrenzenbekanntmachung). Only the date is fixed. The new amounts take effect on ${d(N.gilt_ab, 'en')}; until ${d(T6.gilt_bis, 'en')} the 2026 table, with a basic monthly allowance of ${e2(T6.monat.grund, 'en')}, stays in force. How far the limits rise is set by section 850c(4) of the Code of Civil Procedure (ZPO): they follow the percentage change in the basic income tax allowance under section 32a of the Income Tax Act, taken as it stands on 1 January. For 2026 that tax allowance was ${e2(N.grundfreibetragEStG2026, 'en')}; its value on 1 January 2027 will decide the new table. The limits went up by ${pc(r56, 'en')} in 2026 and by ${pc(r45, 'en')} in 2025. The calculator on this page works with a rate you enter yourself, so its result is a worked example, never an official figure.`,
    faqs: [
      { q: 'When will Germany publish the 2027 garnishment table?', a: `The law sets no publication day, only the date the new amounts apply: ${d(N.gilt_ab, 'en')}. The last three notices are dated ${d(T4.datum, 'en')}, ${d(T5.datum, 'en')} and ${d(T6.datum, 'en')}, so each came out in spring, a few months ahead of July. As soon as the 2027 notice appears in the Federal Law Gazette, we load its values and check every row against our arithmetic.` },
      { q: 'Could the 2027 limits end up lower than in 2026?', a: 'The statute ties the adjustment to the percentage change in the basic income tax allowance. If that allowance does not fall, the garnishment limits do not fall either; if it stays flat, they stay flat. At the last two adjustments, in 2025 and 2026, every amount went up. That says nothing certain about 2027 while the figure for 1 January 2027 is still open.' },
      { q: 'Do I have to tell my employer anything in July 2027?', a: `No. A German garnishment order simply refers to the table, and section 850c(5) ZPO says that reference is enough. Your employer switches to the new table for the pay period starting on ${d(N.gilt_ab, 'en')}. Check your first payslip after that date: with unchanged net pay, the amount taken should be smaller if the allowances have gone up.` },
      { q: 'What does the assumption in the 2027 calculator do?', a: `You enter a rate by which the amounts might rise. The calculator lifts the basic allowance, the dependant increases and the ceiling of the 2026 table by exactly that rate and runs your net pay through the result. At ${pc(annahme / 100, 'en')}, for example, the basic allowance would be ${e2(W.grund, 'en')}. It is arithmetic with your own number, not a forecast and not an official table.` },
    ],
    body: (h) => `
<h2>The rule behind every new table</h2>
<p>German exemption limits are not set by discretion. ${h.src('zpo850c', 'Section 850c(4) ZPO')} requires the ministry to publish three sets of figures in the Federal Law Gazette: the exempt basic amount, the increases for people you support, and the ceiling above which everything can be taken. All three change on 1 July, by the same percentage as the basic income tax allowance has changed against the previous year. The reference point is the version of the tax law in force on 1 January of that year.</p>
<p>For 2027 this means the deciding figure is the basic allowance under ${h.src('estg32a', 'section 32a of the Income Tax Act')} on 1 January 2027, compared with ${e2(N.grundfreibetragEStG2026, h.lang)} on 1 January 2026. The legal texts we checked do not yet contain the 2027 value, so we quote no percentage. If parliament changes the tax scale, the garnishment table moves with it. Only the published notice gives binding figures, down to the cent.</p>
<p>The table itself then follows mechanically. Its rows leave no room for judgement: they come from the allowance, the tenths of section 850c(3) and the rounding down to steps of ${e2(T6.monat.stufe, h.lang)} under subsection 5. Anyone who knows the new allowances can rebuild every row.</p>
<h2>How much the limits rose recently</h2>
<p>We checked the amounts of three table years against the Federal Law Gazette. The increase differed from year to year: the basic allowance rose by ${pc(r45, h.lang)} in July 2025 and by ${pc(r56, h.lang)} in July 2026. The ceiling and the dependant increases moved in the same proportion each time; small gaps come only from rounding to the cent.</p>
${h.table(['Valid from', 'Basic allowance', 'First dependant', 'Each further dependant', 'Ceiling'], (['2024', '2025', '2026'] as const).map((j) => { const t = h.P.tabellen[j]; return [h.day(t.gilt_ab), e2(t.monat.grund, h.lang), e2(t.monat.erste, h.lang), e2(t.monat.weitere, h.lang), e2(t.monat.hoechst, h.lang)]; }), 'Monthly amounts under section 850c ZPO per the 2024, 2025 and 2026 notices', ['l', 'r', 'r', 'r', 'r'])}
<p>The figures come from the ${h.src('bek2026', '2026 notice')} and the ${h.src('bek2025', '2025 notice')}, each of which also states the previous year's amounts. What matters to you in the end is not the percentage but the row your net pay falls into. The comparison below shows what the last increase meant for your own wage.</p>
${h.mini('vergleich', { p: ['netto', 'personen'], d: { netto: 2800, personen: 1 }, c: 'Compare the 2025 and 2026 tables in full' })}
<h2>Working with your own assumption</h2>
<p>The calculator at the top raises every amount of the 2026 table by the rate you enter and then applies the same arithmetic as a real table. An example at ${pc(annahme / 100, h.lang)}, picked only to illustrate: on ${e2(2800, h.lang)} net with one dependant, ${e2(dann, h.lang)} would be attachable instead of ${e2(heute, h.lang)}. The basic allowance in this example would be ${e2(W.grund, h.lang)} and the ceiling ${e2(W.hoechst, h.lang)}.</p>
<p>Use the assumption for rough planning, for instance to see whether a repayment plan would still be affordable from summer 2027. For your payslip, rely only on the official table. Until the end of June 2027 your employer works with the ${h.a('pfaendungstabelle', '2026 garnishment table')}.</p>
<p>The new table also reaches your bank account. The base amount of a P-account (Pfändungsschutzkonto) is the monthly basic allowance rounded up to the next 10 euros under section 899(1) ZPO, currently ${e2(h.sockel(), h.lang)}. When the allowance rises in July 2027, that amount rises too; details under ${h.a('p-konto-freibetrag', 'P-account allowance')}.</p>`,
  },
});
