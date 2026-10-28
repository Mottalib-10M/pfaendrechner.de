/** Declarative calculators (src/lib/tool-specs.ts), rendered by components/calc/SpecTool.tsx. */
export type V = Record<string, number | string>;
export interface NumIn { kind?: 'num'; id: string; label: string; def: number; unit?: string; max?: number; decimals?: number; help?: string; adv?: boolean; wide?: boolean }
export interface ChoiceIn { kind: 'choice'; id: string; label: string; def: string; options: Array<{ value: string; label: string }>; help?: string; adv?: boolean; wide?: boolean }
export type Opt = { value: string; label: string };
/** Options can depend on the other fields (the counties of the chosen state). */
export interface SelectIn { kind: 'select'; id: string; label: string; def: string; options: Opt[] | ((v: V) => Opt[]); help?: string; adv?: boolean; wide?: boolean }
/** Date ISO (AAAA-MM-JJ). La valeur par défaut est fixe (jamais « aujourd'hui » au build, RECETTE §17.5). */
export interface DateIn { kind: 'date'; id: string; label: string; def: string; help?: string; adv?: boolean; wide?: boolean }
export type Input = NumIn | ChoiceIn | SelectIn | DateIn;
export interface OutTable { caption?: string; headers: string[]; rows: string[][]; align?: Array<'l' | 'r'> }
export interface ToolOut {
  label: string; value: string; sub?: string;
  rows: Array<[string, string, number?]>;
  table?: OutTable;
  /** Tableaux supplémentaires, sous le premier. */
  tables?: OutTable[];
  note?: string;
}
export interface ToolSpec { inputs: Input[]; run: (v: V) => ToolOut }
/** The options of a select for the current values, and the value actually in force (the first option
 *  when the stored one is not offered, e.g. a county of the previous state). */
export const optsOf = (i: SelectIn, v: V): Opt[] => (typeof i.options === 'function' ? i.options(v) : i.options);
export function resolve(inputs: Input[], v: V): V {
  const out: V = { ...v };
  for (const i of inputs) if (i.kind === 'select') { const o = optsOf(i, out); if (!o.some((x) => x.value === String(out[i.id]))) out[i.id] = o[0]?.value ?? ''; }
  return out;
}
