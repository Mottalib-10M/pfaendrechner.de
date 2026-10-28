/**
 * Trousse de rédaction (CONTRIBUTING-SEITEN.md) : tout chiffre écrit dans une page vient d'ici, jamais tapé à la main.
 *   K.P                         paramètres datés (params-2026.json)
 *   K.pfaendbar, K.freibetrag, K.sockel, K.pkontoFrei …   moteur pur (engine/pfaendung.ts)
 *   K.tool(kind, lang, args, valeurs)  lance un simulateur de tool-specs.ts et rend sa carte de résultat
 */
import P from '../data/params-2026.json';
import * as E from './engine/pfaendung';
import { runTool } from './tool-specs';
import { LAST_UPDATED } from '../data/site-config';

export const KIT = { P, ...E, tool: runTool, LESEDATUM: LAST_UPDATED };
export type Kit = typeof KIT;
