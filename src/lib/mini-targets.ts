/** Où mène le bouton d'un mini-simulateur : la première page qui porte le calculateur complet de ce type. */
import { ROUTES, route } from '../i18n/routes';
import { pageOfTool } from './pages';
import type { Lang } from './format';
export const miniHref = (kind: string, lang: Lang, fallback: string) => { const id = pageOfTool(kind); return id && ROUTES.some((r) => r.id === id) ? route(id, lang) : fallback; };
