/**
 * Mini-simulateur de page (RECETTE §9.3) : un à trois champs d'un simulateur du site, le chiffre du
 * sujet en grand, quelques lignes et un lien vers le simulateur complet. Même moteur, même spec
 * (src/lib/tool-specs.ts). `data-chrome` : ses libellés ne comptent ni dans les mots ni dans la
 * comparaison entre pages. Premier rendu = valeurs par défaut du build (§17.5).
 */
import { useMemo, useState } from 'react';
import NumberField from '../ui/NumberField';
import SelectField from '../ui/SelectField';
import DateField from '../ui/DateField';
import { getTool } from '../../lib/tool-specs';
import { optsOf, resolve, type V } from '../../lib/tool-types';
import { t } from '../../i18n/ui';
import type { Lang } from '../../lib/format';

interface Props { kind: string; lang: Lang; href?: string; /** JSON : { t, p, d, c } */ arg?: string }

export default function MiniSim({ kind, lang, href, arg }: Props) {
  const a = useMemo(() => (arg ? JSON.parse(arg) : {}) as { t?: string; p?: string[]; d?: Record<string, number | string>; c?: string }, [arg]);
  const spec = useMemo(() => getTool(kind, lang, a.d), [kind, lang, a]);
  const shown = spec.inputs.filter((i) => (a.p ?? [spec.inputs[0].id]).includes(i.id));
  const [v, setV] = useState<V>(() => Object.fromEntries(spec.inputs.map((i) => [i.id, i.def])));
  const rv = useMemo(() => resolve(spec.inputs, v), [v, spec]);
  const out = useMemo(() => spec.run(rv), [rv, spec]);
  const set = (id: string) => (x: number | string) => setV((o) => ({ ...o, [id]: x }));
  return (
    <div data-chrome data-mini={kind} className="not-prose rechner-mini my-8 rounded-xl border border-navy-200 bg-white p-4 sm:p-5">
      <p className="text-base font-semibold text-navy-900">{a.t ?? out.label}</p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-5 sm:grid-cols-2">
        <form data-simulateur-secondaire className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-y-3" onSubmit={(e) => e.preventDefault()}>
          {shown.map((i) => i.kind === 'date' ? <DateField key={i.id} id={`m-${kind}-${i.id}`} label={i.label} value={String(rv[i.id])} onChange={set(i.id)} /> : (i.kind === 'choice' || i.kind === 'select')
            ? <SelectField key={i.id} id={`m-${kind}-${i.id}`} label={i.label} value={String(rv[i.id])} onChange={set(i.id)} options={i.kind === 'select' ? optsOf(i, rv) : i.options} />
            : <NumberField key={i.id} id={`m-${kind}-${i.id}`} label={i.label} value={Number(rv[i.id])} onChange={set(i.id)} unit={i.unit} max={i.max} decimals={i.decimals} lang={lang} />)}
        </form>
        <div aria-live="polite" className="rounded-lg border-l-4 border-accent-500 bg-navy-50 p-4">
          <p className="text-sm font-medium text-navy-600">{out.label}</p>
          <p className="tabular-nums mt-1 text-3xl font-bold text-navy-900">{out.value}</p>
          <table className="mt-3 w-full table-fixed text-sm"><tbody className="divide-y divide-navy-200">
            {out.rows.slice(0, 4).map(([l, x]) => <tr key={l}><td className="py-1.5 pe-3 text-navy-600 hyphens-auto [overflow-wrap:anywhere]">{l}</td><td className="w-[42%] tabular-nums py-1.5 text-right text-navy-900 [overflow-wrap:anywhere]">{x}</td></tr>)}
          </tbody></table>
        </div>
      </div>
      {href && <a href={href} className="mt-4 inline-block text-sm font-medium text-accent-700 hover:underline">{a.c ?? t(lang).openFull} →</a>}
    </div>
  );
}
