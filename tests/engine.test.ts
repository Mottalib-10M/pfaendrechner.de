/** Moteur : chaque ligne des tableaux officiels 2025 et 2026 (mensuel, hebdomadaire, journalier), puis les règles du compte P et des délais. */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import * as E from '../src/lib/engine/pfaendung';

type Fix = Record<E.Periode, Array<[number, number, number[]]>>;
const fix = (y: string) => JSON.parse(readFileSync(new URL(`./fixtures/tabelle-${y}.json`, import.meta.url), 'utf8')) as Fix;

describe('tableaux officiels, ligne par ligne', () => {
  for (const jahr of ['2026', '2025'] as const) {
    const f = fix(jahr);
    for (const per of ['monat', 'woche', 'tag'] as const) {
      it(`${jahr} ${per} : ${f[per].length} lignes`, () => {
        expect(f[per].length).toBeGreaterThan(290);
        let fehler = 0;
        for (const [von, bis, werte] of f[per]) {
          for (const netto of [von, bis]) for (let p = 0; p <= 5; p++) {
            const r = E.pfaendbar(netto, p, per, jahr).pfaendbar;
            if (Math.abs(r - werte[p]) > 0.001) { fehler++; if (fehler < 5) console.log(jahr, per, netto, p, r, werte[p]); }
          }
        }
        expect(fehler).toBe(0);
      });
    }
  }
  it('au-delà du plafond, le surplus est saisissable en entier', () => {
    const r = E.pfaendbar(5866.30, 0, 'monat', '2026');
    expect(r.pfaendbar).toBeCloseTo(2290.82 + 1000, 2);
    expect(E.pfaendbar(5000, 1).ueberHoechst).toBeCloseTo(133.70, 2);
  });
  it('franchises 2026', () => {
    expect(E.freibetrag(0)).toBe(1587.40);
    expect(E.freibetrag(1)).toBe(2184.82);
    expect(E.freibetrag(5)).toBe(3516.14);
    expect(E.freibetrag(9)).toBe(3516.14);
    expect(E.pfaendbarAb(0)).toBe(1590);
    expect(E.pfaendbarAb(1)).toBe(2190);
  });
  it('table à une date', () => {
    expect(E.tabelleAm('2026-06-30')).toBe('2025');
    expect(E.tabelleAm('2026-07-01')).toBe('2026');
  });
});

describe('compte P', () => {
  it('base arrondie à la dizaine supérieure', () => {
    expect(E.sockel('2026')).toBe(1590);
    expect(E.sockel('2025')).toBe(1560);
  });
  it('augmentations § 902', () => {
    expect(E.pkontoErhoehung(1)).toBeCloseTo(597.42, 2);
    expect(E.pkontoErhoehung(2)).toBeCloseTo(930.25, 2);
    const x = E.pkontoFrei({ personen: 1, kinder: 1 });
    expect(x.gesamt).toBeCloseTo(1590 + 597.42 + 259, 2);
    expect(E.pkontoFrei({ personen: 0, sgb2: 1700 }).gesamt).toBeCloseTo(1700, 2);
  });
  it('report sur trois mois', () => {
    const r = E.uebertrag(1590, [{ eingang: 1590, ausgaben: 1000 }, { eingang: 1590, ausgaben: 1590 }, { eingang: 0, ausgaben: 0 }]);
    expect(r[0].uebertrag).toBe(590);
    expect(r[0].pfaendbar).toBe(0);
    expect(r[1].geschuetzt).toBe(2180);
    expect(r[1].uebertrag).toBe(590);
    const z = E.uebertrag(1590, [{ eingang: 2500, ausgaben: 1590 }]);
    expect(z[0].pfaendbar).toBe(910);
    // une part non utilisée expire après trois mois
    const v = E.uebertrag(1000, [{ eingang: 1500, ausgaben: 0 }, { eingang: 0, ausgaben: 0 }, { eingang: 0, ausgaben: 0 }, { eingang: 0, ausgaben: 0 }, { eingang: 0, ausgaben: 0 }]);
    expect(v[0].pfaendbar).toBe(500);
    expect(v[4].uebertrag).toBeLessThanOrEqual(1000);
  });
  it('rappels § 904', () => {
    expect(E.nachzahlung(480, 3, 1590, 1500).pfaendbar).toBe(0);
    const r = E.nachzahlung(900, 3, 1590, 1400);
    expect(r.geschuetzt).toBeCloseTo(570, 2);
    expect(r.pfaendbar).toBeCloseTo(330, 2);
  });
  it('prime de Noël et net § 850e', () => {
    expect(E.weihnachtsFrei('2026')).toBe(795);
    expect(E.weihnachtsFrei('2025')).toBe(780);
    const n = E.pfaendbaresNetto({ auszahlung: 3000, ueberstunden: 200, weihnachtsgeld: 1000 });
    expect(n.netto).toBe(3000 - 100 - 795);
  });
});

describe('dates', () => {
  it('Pâques', () => {
    expect(E.ostern(2026)).toBe('2026-04-05');
    expect(E.ostern(2027)).toBe('2027-03-28');
    expect(E.ostern(2028)).toBe('2028-04-16');
    expect(E.ostern(2025)).toBe('2025-04-20');
  });
  it('fériés nationaux 2027', () => {
    expect(E.bundesFeiertage(2027)).toEqual(['2027-01-01', '2027-03-26', '2027-03-29', '2027-05-01', '2027-05-06', '2027-05-17', '2027-10-03', '2027-12-25', '2027-12-26']);
  });
  it('délais en mois (§ 188 BGB, § 222 ZPO)', () => {
    expect(E.fristMonate('2027-01-31', 1).roh).toBe('2027-02-28');
    expect(E.fristMonate('2026-11-03', 1).ende).toBe('2026-12-03');
    const s = E.fristMonate('2026-11-14', 1); // 14.12.2026 lundi
    expect(s.ende).toBe('2026-12-14');
    const w = E.fristMonate('2026-11-26', 1); // 26.12.2026 férié, 27 dimanche
    expect(w.ende).toBe('2026-12-28');
    expect(w.verschoben).toBe(true);
  });
  it('jours ouvrés bancaires', () => {
    expect(E.geschaeftstagNach('2026-10-28', 4)).toBe('2026-11-03');
    expect(E.geschaeftstagNach('2026-12-23', 2)).toBe('2026-12-28');
  });
  it('durée de remboursement', () => {
    expect(E.laufzeit(1000, 300)).toBe(4);
    expect(E.laufzeit(1000, 0)).toBeNull();
  });
  it('hypothèse 2027', () => {
    const w = E.prognoseWerte(0);
    expect(E.pfaendbarMit(w, 2500, 1)).toBe(E.pfaendbar(2500, 1).pfaendbar);
  });
});

describe('nombre de lignes déclaré', () => {
  it('params.zeilen = lignes des fixtures', async () => {
    const P = (await import('../src/data/params-2026.json')).default as { zeilen: Record<string, Record<string, number>> };
    for (const y of ['2025', '2026']) { const f = fix(y); for (const p of ['monat', 'woche', 'tag'] as const) expect(P.zeilen[y][p]).toBe(f[p].length); }
  });
});
