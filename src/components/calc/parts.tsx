/** Pièces communes des simulateurs : carte de résultat, lignes de détail, choix, lien de partage. */
import { useState, type ReactNode } from 'react';

export function ResultCard({ label, value, sub, children }: { label: string; value: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div data-resultat aria-live="polite" className="rounded-lg border-t-4 border-accent-500 bg-navy-50 p-4 sm:p-5">
      <p className="text-sm font-medium text-navy-700">{label}</p>
      <p className="tabular-nums mt-1 text-[2.3rem] font-bold leading-tight text-navy-900">{value}</p>
      {sub && <p className="mt-1 text-sm text-navy-700">{sub}</p>}
      {children}
    </div>
  );
}

export function Rows({ rows }: { rows: Array<[string, string, number?]> }) {
  const max = Math.max(1, ...rows.map((r) => r[2] ?? 0));
  return (
    <table className="mt-3 w-full table-fixed text-sm"><tbody className="divide-y divide-navy-200">
      {rows.map(([l, v, w]) => (
        <tr key={l}><td className="py-1.5 pe-3 text-navy-700 hyphens-auto [overflow-wrap:anywhere]">{l}{w !== undefined && w > 0 && <span aria-hidden="true" className="mt-1 block h-1 rounded bg-accent-500/60" style={{ width: `${Math.max(3, (w / max) * 100)}%` }} />}</td><td className="w-[42%] tabular-nums py-1.5 text-right align-top text-navy-900 [overflow-wrap:anywhere]">{v}</td></tr>
      ))}
    </tbody></table>
  );
}

/** Deux à quatre options qui remplissent tout le cadre (RECETTE §10.3). */
export function Choice<T extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-rows-subgrid row-span-3 content-start gap-y-0">
      <span id={`${id}-l`} className="mb-1 block text-sm font-medium text-navy-700">{label}</span>
      <div role="group" aria-labelledby={`${id}-l`} className="grid h-12 grid-flow-col auto-cols-fr overflow-hidden rounded-lg border border-navy-300">
        {options.map((o) => (
          <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
            className={`h-full px-2 text-sm font-medium ${value === o.value ? 'bg-accent-700 text-white' : 'bg-white text-navy-700 hover:bg-navy-50'}`}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

export function ShareRow({ methodHref, labels }: { methodHref?: string; labels: { copyLink: string; copied: string; print: string; howComputed: string } }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* pas de presse-papiers */ } };
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-600">
      <button type="button" onClick={copy} className="underline hover:text-navy-900">{copied ? labels.copied : labels.copyLink}</button>
      <button type="button" onClick={() => window.print()} className="underline hover:text-navy-900">{labels.print}</button>
      {methodHref && <a href={methodHref} className="underline hover:text-navy-900">{labels.howComputed}</a>}
    </div>
  );
}
