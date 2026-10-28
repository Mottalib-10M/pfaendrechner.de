interface Props { id: string; label: string; value: string; onChange: (v: string) => void; help?: string; className?: string; min?: string; max?: string }

/** Champ de date natif, à la hauteur des autres champs (48 px). La valeur est une date ISO AAAA-MM-JJ. */
export default function DateField({ id, label, value, onChange, help, className = '', min = '2020-01-01', max = '2030-12-31' }: Props) {
  return (
    <div className={`grid grid-rows-subgrid row-span-3 content-start gap-y-0 ${className}`}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy-700">{label}</label>
      <div className="relative self-start">
        <input id={id} type="date" value={value} min={min} max={max} onChange={(e) => { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) onChange(e.target.value); }} aria-describedby={help ? `${id}-help` : undefined}
          className="tabular-nums w-full min-w-0 rounded-lg border border-navy-300 bg-white h-12 px-3 text-navy-900 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20" />
      </div>
      {help && <p id={`${id}-help`} className="mt-1 text-xs text-navy-500">{help}</p>}
    </div>
  );
}
