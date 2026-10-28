/** Formatage localisé, une locale par langue de page (RECETTE §4) : « 255 € » en allemand,
 *  « €255 » en anglais. Chaque fonction prend la langue. */
import { NUM_TAGS, CURRENCY } from '../data/site-config';

export type Lang = 'de' | 'en';
const cache = new Map<string, Intl.NumberFormat>();
function nf(lang: Lang, opts: Intl.NumberFormatOptions): Intl.NumberFormat {
  const k = lang + JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new Intl.NumberFormat(NUM_TAGS[lang] ?? 'de-DE', opts));
  return cache.get(k)!;
}
export function formatMoney(value: number, decimals = 0, lang: Lang = 'de'): string {
  const v = Math.abs(value) < 0.5 && decimals === 0 ? 0 : value;
  return nf(lang, { style: 'currency', currency: CURRENCY, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(v);
}
export function formatNumber(value: number, decimals = 0, lang: Lang = 'de'): string {
  return nf(lang, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}
/** Nombre tiré des paramètres dans un texte : décimales utiles seulement (RECETTE §4.1). */
export function formatDecimal(value: number, max = 2, lang: Lang = 'de'): string {
  return nf(lang, { maximumFractionDigits: max }).format(value);
}
/** Taux : espace insécable avant % en allemand, collé en anglais (RECETTE §7). */
export function formatPercent(value: number, decimals = 1, lang: Lang = 'de'): string {
  return nf(lang, { style: 'percent', minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value).replace(/(\d)\s?%/, lang === 'de' ? '$1 %' : '$1%');
}
export function parseLocaleNumber(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, '');
  const lastComma = cleaned.lastIndexOf(','), lastDot = cleaned.lastIndexOf('.');
  let s = cleaned;
  if (/^-?\d{1,3}(,\d{3})+$/.test(cleaned)) s = cleaned.replace(/,/g, '');
  else if (lastComma > lastDot) s = cleaned.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) s = cleaned.replace(/\./g, '');
  else s = cleaned.replace(/,/g, '');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}
/** Date en toutes lettres, dans la langue de la page. Accepte une étiquette de langue (« de-DE ») ou une langue du site. */
export function displayDate(iso: string, langTag: string): string {
  const tag = NUM_TAGS[langTag] ?? (langTag.startsWith('en') ? 'en-GB' : langTag);
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
