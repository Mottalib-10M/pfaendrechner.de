/**
 * Rend un simulateur déclaratif (src/lib/tool-specs.ts) : champs à gauche, carte de résultat à droite
 * (data-resultat), options repliées, lien de partage écrit seulement après une action de l'utilisateur.
 * Premier rendu = valeurs par défaut du build ; un lien partagé est lu après le montage (RECETTE §17.5).
 */
import { useEffect, useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import DateField from '../ui/DateField';
import { Choice, ResultCard, Rows, ShareRow } from './parts';
import { readParams, updateURL } from '../../lib/url-state';
import { getTool } from '../../lib/tool-specs';
import { optsOf, resolve, type Input, type V } from '../../lib/tool-types';
import { t } from '../../i18n/ui';
import type { Lang } from '../../lib/format';

interface Props { kind: string; lang: Lang; arg?: string; methodHref?: string; idPrefix?: string }

export default function SpecTool({ kind, lang, arg, methodHref, idPrefix = 't' }: Props) {
  const ui = t(lang);
  const spec = useMemo(() => getTool(kind, lang, arg ? JSON.parse(arg) : undefined), [kind, lang, arg]);
  const defaults = useMemo(() => Object.fromEntries(spec.inputs.map((i) => [i.id, i.def])) as V, [spec]);
  const [v, setV] = useState<V>(defaults);
  useEffect(() => {
    const u = readParams(window.location.search);
    if (![...u.keys()].length) return;
    const next: V = { ...defaults };
    for (const i of spec.inputs) {
      const x = u.get(i.id);
      if (x === null) continue;
      if (i.kind === 'choice') { if (i.options.some((o) => o.value === x)) next[i.id] = x; }
      else if (i.kind === 'select') { if (optsOf(i, next).some((o) => o.value === x)) next[i.id] = x; }
      else if (i.kind === 'date') { if (/^\d{4}-\d{2}-\d{2}$/.test(x)) next[i.id] = x; }
      else { const f = parseFloat(x); if (!isNaN(f)) next[i.id] = Math.min(f, i.max ?? Infinity); }
    }
    setV(next);
  }, []);
  const rv = useMemo(() => resolve(spec.inputs, v), [v, spec]);
  useEffect(() => updateURL(rv as Record<string, string | number>), [rv]);
  const out = useMemo(() => spec.run(rv), [rv, spec]);
  const set = (id: string) => (x: number | string) => setV((o) => ({ ...o, [id]: x }));
  const field = (i: Input) => {
    const id = `${idPrefix}-${i.id}`;
    // Aide longue : le champ prend toute la rangée (RECETTE §10.3, aide jamais coincée dans une demi-colonne).
    const cls = i.wide || ('help' in i && typeof i.help === 'string' && i.help.length > 45) ? 'sm:col-span-2' : '';
    if (i.kind === 'choice') return <div key={i.id} className={`grid grid-rows-subgrid row-span-3 ${cls}`}><Choice id={id} label={i.label} value={String(rv[i.id])} options={i.options} onChange={set(i.id)} /></div>;
    if (i.kind === 'date') return <DateField key={i.id} id={id} label={i.label} value={String(rv[i.id])} onChange={set(i.id)} help={i.help} className={cls} />;
    if (i.kind === 'select') return <SelectField key={i.id} id={id} label={i.label} value={String(rv[i.id])} onChange={set(i.id)} options={optsOf(i, rv)} help={i.help} className={cls} />;
    return <NumberField key={i.id} id={id} label={i.label} value={Number(rv[i.id])} onChange={set(i.id)} unit={i.unit} max={i.max} decimals={i.decimals} help={i.help} className={cls} lang={lang} />;
  };
  const main = spec.inputs.filter((i) => !i.adv), adv = spec.inputs.filter((i) => i.adv);
  return (
    <div className="rounded-xl border border-navy-200 bg-white p-4 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)]">
        <form className="grid content-start grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          {main.map(field)}
          {adv.length > 0 && (
            <details className="sm:col-span-2 rounded-lg border border-navy-200 px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-navy-700">{ui.moreOptions}</summary>
              <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{adv.map(field)}</div>
            </details>
          )}
        </form>
        <ResultCard label={out.label} value={out.value} sub={out.sub}>
          <Rows rows={out.rows} />
          {out.note && <p className="mt-2 text-xs text-navy-600">{out.note}</p>}
          <ShareRow methodHref={methodHref} labels={ui} />
        </ResultCard>
      </div>
      {[out.table, ...(out.tables ?? [])].filter((x) => !!x).map((tb, ti) => (
        <div key={ti} className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            {tb!.caption && <caption className="mb-2 text-left text-sm text-navy-700">{tb!.caption}</caption>}
            <thead><tr>{tb!.headers.map((h, i) => <th key={h} scope="col" className={`border-b border-navy-300 px-2 py-1.5 font-semibold text-navy-900 ${tb!.align?.[i] === 'r' ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
            <tbody>{tb!.rows.map((r, k) => <tr key={k}>{r.map((c, i) => <td key={i} className={`tabular-nums border-b border-navy-100 px-2 py-1.5 text-navy-800 ${tb!.align?.[i] === 'r' ? 'text-right' : 'text-left'}`} dangerouslySetInnerHTML={{ __html: c }} />)}</tr>)}</tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
