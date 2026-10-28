/** Registre : chaque fichier de src/content/guides est chargé ici. */
import type { GuideDef } from './page-types';

const base = (file: string) => file.split('/').pop()!.replace(/\.ts$/, '');
const g = import.meta.glob<{ default: GuideDef | GuideDef[] }>(['../content/guides/*.ts', '!../content/guides/_*.ts'], { eager: true });
export const GUIDES: GuideDef[] = Object.entries(g).flatMap(([f, m]) => {
  const list = Array.isArray(m.default) ? m.default : [m.default];
  if (!Array.isArray(m.default) && m.default.id !== base(f)) throw new Error(`${f}: id "${m.default.id}" differs from the file name`);
  return list;
}).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
export const guideById = (id: string) => GUIDES.find((p) => p.id === id);
/** Première page qui porte un calculateur : la cible du lien d'un mini-simulateur. */
export const pageOfTool = (kind: string) => GUIDES.find((p) => p.tool === kind)?.id;
