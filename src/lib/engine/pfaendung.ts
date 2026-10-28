/**
 * Moteur de la saisie sur salaire et du compte P (fonctions pures, testées dans tests/engine.test.ts).
 *
 * § 850c ZPO : le revenu net, éventuellement diminué de la part au-delà du plafond (Abs. 3 Satz 3), est
 * arrondi au palier inférieur (10 € par mois, 2,50 € par semaine, 0,50 € par jour, Abs. 5) ; au-dessus de
 * la franchise (Abs. 1, augmentée selon Abs. 2), 7/10 sont saisissables sans personne à charge, 5/10 avec
 * une, puis 4, 3, 2 et 1/10 (Abs. 3) ; la part au-delà du plafond est saisissable en entier.
 * Le résultat est recoupé ligne par ligne avec les trois tableaux officiels 2025 et 2026 (tests/fixtures).
 * Tous les montants sont calculés en centimes entiers.
 */
import P from '../../data/params-2026.json';

export type Periode = 'monat' | 'woche' | 'tag';
export type TabJahr = '2026' | '2025' | '2024';
export interface Werte { grund: number; erste: number; weitere: number; hoechst: number; stufe: number }

const ct = (x: number) => Math.round(x * 100);
const eur = (c: number) => c / 100;
const T = P.tabellen as Record<TabJahr, { gilt_ab: string; gilt_bis: string; fundstelle: string; datum: string } & Record<Periode, Werte>>;

export const QUOTEN = P.quoten;
export const PERSONEN_MAX = P.personenMax;

/** La table en vigueur à une date ISO (AAAA-MM-JJ) : 2026 à partir du 1er juillet 2026, etc. */
export function tabelleAm(iso: string): TabJahr {
  if (iso >= T['2026'].gilt_ab) return '2026';
  if (iso >= T['2025'].gilt_ab) return '2025';
  return '2024';
}
export const werte = (jahr: TabJahr, periode: Periode): Werte => T[jahr][periode];
export const tabelleInfo = (jahr: TabJahr) => T[jahr];

/** Montant insaisissable de base selon les personnes à charge (§ 850c Abs. 1 et 2), en euros. */
export function freibetrag(personen: number, periode: Periode = 'monat', jahr: TabJahr = '2026'): number {
  const w = werte(jahr, periode);
  const n = Math.max(0, Math.min(PERSONEN_MAX, Math.floor(personen)));
  return eur(ct(w.grund) + (n >= 1 ? ct(w.erste) : 0) + Math.max(0, n - 1) * ct(w.weitere));
}

export interface Ergebnis {
  netto: number; personen: number; periode: Periode; jahr: TabJahr;
  /** Revenu arrondi au palier (la ligne du tableau officiel). */
  stufe: number; stufeBis: number;
  freibetrag: number; quote: number;
  /** Part au-delà du plafond, saisissable en entier. */
  ueberHoechst: number;
  pfaendbar: number; unpfaendbar: number;
}

/** Montant saisissable et montant laissé au débiteur pour un revenu net (§ 850c Abs. 3 et 5 ZPO). */
export function pfaendbar(netto: number, personen = 0, periode: Periode = 'monat', jahr: TabJahr = '2026'): Ergebnis {
  const w = werte(jahr, periode);
  const n = Math.max(0, Math.min(PERSONEN_MAX, Math.floor(personen)));
  const nc = Math.max(0, ct(netto));
  const hc = ct(w.hoechst), sc = ct(w.stufe);
  const ueber = Math.max(0, nc - hc);
  const basis = Math.min(nc, hc);
  const stufe = Math.floor(basis / sc) * sc;
  const stufeBis = Math.min(stufe + sc - 1, hc);
  const fc = ct(freibetrag(n, periode, jahr));
  const q = QUOTEN[n];
  const teil = stufe > fc ? Math.round((stufe - fc) * q) : 0;
  const pc = Math.min(nc, teil + ueber);
  return {
    netto: eur(nc), personen: n, periode, jahr, stufe: eur(stufe), stufeBis: eur(stufeBis), freibetrag: eur(fc), quote: q,
    ueberHoechst: eur(ueber), pfaendbar: eur(pc), unpfaendbar: eur(nc - pc),
  };
}

/** Revenu net à partir duquel quelque chose devient saisissable (premier palier au-dessus de la franchise). */
export function pfaendbarAb(personen = 0, periode: Periode = 'monat', jahr: TabJahr = '2026'): number {
  const sc = ct(werte(jahr, periode).stufe);
  const fc = ct(freibetrag(personen, periode, jahr));
  return eur((Math.floor(fc / sc) + 1) * sc);
}

/** Lignes du tableau officiel autour d'un revenu : [de, à, saisissable pour 0 à 5 personnes]. */
export function tabellenZeilen(ab: number, anzahl: number, periode: Periode = 'monat', jahr: TabJahr = '2026'): Array<{ von: number; bis: number; werte: number[] }> {
  const w = werte(jahr, periode);
  const sc = ct(w.stufe), hc = ct(w.hoechst);
  let s = Math.floor(Math.max(0, ct(ab)) / sc) * sc;
  const out: Array<{ von: number; bis: number; werte: number[] }> = [];
  while (out.length < anzahl && s <= hc) {
    out.push({ von: eur(s), bis: eur(Math.min(s + sc - 1, hc)), werte: [0, 1, 2, 3, 4, 5].map((p) => pfaendbar(eur(s), p, periode, jahr).pfaendbar) });
    s += sc;
  }
  return out;
}

/* --------------------------------------------------------------- § 850a, § 850e : le net qui compte */
/** Moitié du montant mensuel insaisissable arrondi à la dizaine supérieure : part protégée de la prime de Noël (§ 850a Nr. 4). */
export function weihnachtsFrei(jahr: TabJahr = '2026'): number {
  return eur(Math.ceil(ct(werte(jahr, 'monat').grund) / 1000) * 1000 / 2);
}
export interface NettoIn { auszahlung: number; ueberstunden?: number; weihnachtsgeld?: number; urlaubsgeld?: number; aufwand?: number; jahr?: TabJahr }
/** Net à reporter dans le tableau : le net versé, moins ce que § 850a met hors saisie. */
export function pfaendbaresNetto(x: NettoIn) {
  const jahr = x.jahr ?? '2026';
  const ue = Math.max(0, x.ueberstunden ?? 0), wg = Math.max(0, x.weihnachtsgeld ?? 0);
  const ug = Math.max(0, x.urlaubsgeld ?? 0), au = Math.max(0, x.aufwand ?? 0);
  const freiUe = eur(Math.round(ct(ue) / 2));
  const freiWg = Math.min(wg, weihnachtsFrei(jahr));
  const abzug = freiUe + freiWg + ug + au;
  return { freiUeberstunden: freiUe, freiWeihnachten: freiWg, freiUrlaub: ug, freiAufwand: au, abzug, netto: Math.max(0, eur(ct(x.auszahlung) - ct(abzug))) };
}

/* --------------------------------------------------------------- P-Konto (§§ 899, 902 ZPO) */
/** Base du compte P : franchise mensuelle arrondie à la dizaine supérieure (§ 899 Abs. 1). */
export function sockel(jahr: TabJahr = '2026'): number {
  return eur(Math.ceil(ct(werte(jahr, 'monat').grund) / 1000) * 1000);
}
/** Augmentation pour les personnes à charge (§ 902 Satz 1 Nr. 1 avec § 850c Abs. 2). */
export function pkontoErhoehung(personen: number, jahr: TabJahr = '2026'): number {
  return eur(ct(freibetrag(personen, 'monat', jahr)) - ct(werte(jahr, 'monat').grund));
}
export interface PKontoIn { personen: number; kinder?: number; sozial?: number; sgb2?: number; jahr?: TabJahr }
/** Montant protégé par mois sur le compte P : base + personnes + allocations familiales + autres prestations § 902. */
export function pkontoFrei(x: PKontoIn) {
  const jahr = x.jahr ?? '2026';
  const s = sockel(jahr);
  const pers = pkontoErhoehung(x.personen, jahr);
  const kg = Math.max(0, Math.floor(x.kinder ?? 0)) * P.kindergeld;
  const soz = Math.max(0, x.sozial ?? 0);
  // § 902 Satz 1 Nr. 4 : prestations SGB II / XII du titulaire, pour la part qui dépasse la base.
  const sgb2 = Math.max(0, (x.sgb2 ?? 0) - s);
  return { sockel: s, personen: pers, kindergeld: kg, sozial: soz, sgb2Mehr: sgb2, gesamt: eur(ct(s) + ct(pers) + ct(kg) + ct(soz) + ct(sgb2)) };
}

export interface MonatIn { eingang: number; ausgaben: number }
export interface MonatOut { monat: number; guthaben: number; geschuetzt: number; verfuegt: number; uebertrag: number; pfaendbar: number }
/**
 * Modèle simplifié du report (§ 899 Abs. 2) : la part protégée non utilisée d'un mois reste protégée pendant
 * les trois mois suivants ; les retraits s'imputent d'abord sur le plus ancien montant protégé ; ce qui reste
 * sur le compte au-delà de la protection est saisissable. Le moratoire (§ 900, § 835 Abs. 3) n'est pas modélisé.
 */
export function uebertrag(frei: number, monate: MonatIn[], dauer = P.pkonto.uebertragMonate): MonatOut[] {
  const fc = ct(frei);
  let rest = 0; // centimes encore sur le compte (protégés) en fin de mois
  let stuecke: Array<{ von: number; c: number }> = [];
  return monate.map((m, i) => {
    stuecke = stuecke.filter((s) => s.von >= i - dauer);
    stuecke.push({ von: i, c: fc });
    const schutz = stuecke.reduce((a, s) => a + s.c, 0);
    const guthaben = rest + Math.max(0, ct(m.eingang));
    const verfuegt = Math.min(Math.max(0, ct(m.ausgaben)), guthaben, schutz);
    let z = verfuegt; // imputation sur le plus ancien
    for (const s of stuecke) { const d = Math.min(s.c, z); s.c -= d; z -= d; }
    const bleibt = guthaben - verfuegt;
    let geschuetzt = Math.min(bleibt, stuecke.reduce((a, s) => a + s.c, 0));
    // seul l'avoir réellement présent reste protégé : on garde les montants les plus récents
    let budget = geschuetzt;
    for (const s of [...stuecke].reverse()) { const k = Math.min(s.c, budget); s.c = k; budget -= k; }
    stuecke = stuecke.filter((s) => s.c > 0);
    const pf = bleibt - geschuetzt;
    rest = geschuetzt;
    return { monat: i + 1, guthaben: eur(guthaben), geschuetzt: eur(schutz), verfuegt: eur(verfuegt), uebertrag: eur(geschuetzt), pfaendbar: eur(pf) };
  });
}

/** Rappel versé en retard (§ 904 Abs. 2 et 3) : protégé jusqu'à 500 €, au-delà mois par mois. */
export function nachzahlung(betrag: number, monate: number, freiProMonat: number, sonstigesProMonat: number) {
  const g = P.pkonto.nachzahlungGrenze;
  if (betrag <= g) return { geschuetzt: betrag, pfaendbar: 0, proMonat: betrag / Math.max(1, monate), regel: 'grenze' as const };
  const m = Math.max(1, Math.floor(monate));
  const proMonat = betrag / m;
  const luecke = Math.max(0, freiProMonat - sonstigesProMonat);
  const geschuetztMonat = Math.min(proMonat, luecke);
  const geschuetzt = eur(Math.round(ct(geschuetztMonat) * m));
  return { geschuetzt, pfaendbar: eur(ct(betrag) - ct(geschuetzt)), proMonat, regel: 'aufteilung' as const };
}

/* --------------------------------------------------------------- dates : jours fériés et délais */
/** Dimanche de Pâques (algorithme de Gauss, forme de Meeus/Jones/Butcher), calendrier grégorien. */
export function ostern(jahr: number): string {
  const a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const monat = Math.floor((h + l - 7 * m + 114) / 31), tag = ((h + l - 7 * m + 114) % 31) + 1;
  return `${jahr}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
}
const addDays = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
/** Les neuf jours fériés communs à tous les Länder (les fériés d'un seul Land ne sont pas comptés). */
export function bundesFeiertage(jahr: number): string[] {
  const o = ostern(jahr);
  return [`${jahr}-01-01`, addDays(o, -2), addDays(o, 1), `${jahr}-05-01`, addDays(o, 39), addDays(o, 50), `${jahr}-10-03`, `${jahr}-12-25`, `${jahr}-12-26`].sort();
}
const wochentag = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
export const istWerktagFrei = (iso: string) => { const w = wochentag(iso); return w === 0 || w === 6 || bundesFeiertage(Number(iso.slice(0, 4))).includes(iso); };
/** Jour ouvré bancaire suivant (lundi au vendredi, hors fériés nationaux). */
export function geschaeftstagNach(iso: string, n: number): string {
  let d = iso, k = 0;
  while (k < n) { d = addDays(d, 1); if (!istWerktagFrei(d)) k++; }
  return d;
}
/** Fin d'un délai en mois (§ 188 Abs. 2 et 3 BGB) puis report au jour ouvrable suivant (§ 222 Abs. 2 ZPO). */
export function fristMonate(iso: string, monate: number) {
  const [y, m, d] = iso.split('-').map(Number);
  const zm = m - 1 + monate, zy = y + Math.floor(zm / 12), mm = zm % 12;
  const last = new Date(Date.UTC(zy, mm + 1, 0)).getUTCDate();
  const roh = `${zy}-${String(mm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
  let ende = roh;
  while (istWerktagFrei(ende)) ende = addDays(ende, 1);
  return { roh, ende, verschoben: ende !== roh };
}
/** Fin d'un délai en semaines (§ 188 Abs. 2 BGB), reporté selon § 222 Abs. 2 ZPO. */
export function fristWochen(iso: string, wochen: number) {
  const roh = addDays(iso, 7 * wochen);
  let ende = roh;
  while (istWerktagFrei(ende)) ende = addDays(ende, 1);
  return { roh, ende, verschoben: ende !== roh };
}
/** Dernier jour du n-ième mois civil qui suit le mois d'une date (délai d'objection, § 899 Abs. 3). */
export function monatsendeNach(iso: string, n: number): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + n + 1, 0)).toISOString().slice(0, 10);
}
export { addDays };

/** Durée de remboursement d'une dette au rythme du montant saisi (sans intérêts ni frais). */
export function laufzeit(schuld: number, proMonat: number): number | null {
  if (proMonat <= 0) return null;
  return Math.ceil(ct(schuld) / ct(proMonat));
}

/** Hypothèse de table future : tous les montants relevés du même pourcentage (méthode de § 850c Abs. 4), arrondis au centime. */
export function prognoseWerte(prozent: number, periode: Periode = 'monat'): Werte {
  const w = werte('2026', periode), f = 1 + prozent / 100;
  const r = (x: number) => eur(Math.round(ct(x) * f));
  return { grund: r(w.grund), erste: r(w.erste), weitere: r(w.weitere), hoechst: r(w.hoechst), stufe: w.stufe };
}
export function pfaendbarMit(w: Werte, netto: number, personen: number): number {
  const n = Math.max(0, Math.min(PERSONEN_MAX, Math.floor(personen)));
  const nc = Math.max(0, ct(netto)), hc = ct(w.hoechst), sc = ct(w.stufe);
  const ueber = Math.max(0, nc - hc);
  const stufe = Math.floor(Math.min(nc, hc) / sc) * sc;
  const fc = ct(w.grund) + (n >= 1 ? ct(w.erste) : 0) + Math.max(0, n - 1) * ct(w.weitere);
  const teil = stufe > fc ? Math.round((stufe - fc) * QUOTEN[n]) : 0;
  return eur(Math.min(nc, teil + ueber));
}
