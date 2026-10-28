/** llms.txt (RECETTE §21), généré à partir du registre des pages. */
import { GUIDES } from '../lib/pages';
import { SITE_URL, LAST_UPDATED, SITE_NAMES } from '../data/site-config';
import { route } from '../i18n/routes';
import { GROUPS } from '../i18n/nav';
import { KIT as K } from '../lib/kit';
export function GET() {
  const P = K.P, T = P.tabellen['2026'], M = T.monat;
  const lines = [
    `# ${SITE_NAMES.de}`, '',
    `> German wage and bank account garnishment (Pfändung) calculators and guides, in German and English. Protected amounts under section 850c ZPO for pay periods from ${T.gilt_ab} to ${T.gilt_bis} (${T.fundstelle}): basic monthly amount ${M.grund} EUR, plus ${M.erste} EUR for the first and ${M.weitere} EUR for each further dependant (max ${P.personenMax}); income above ${M.hoechst} EUR a month fully attachable. P-account (Pfaendungsschutzkonto, sections 850k and 899 ZPO) base amount ${K.sockel('2026')} EUR a month; child benefit ${P.kindergeld} EUR per child is added on certificate (section 902 ZPO). Calculation checked against every row of the official 2025 and 2026 tables (monthly, weekly, daily). The table from ${P.naechsteTabelle.gilt_ab} is not yet published. Browser-only tools, nothing entered is sent or stored. Independent site published by Radif Partners, not a court, authority or debt advice service; not legal advice. Last updated ${LAST_UPDATED}.`, '',
    ...GROUPS.flatMap((g) => [`## ${g.label.en} / ${g.label.de}`, ...GUIDES.filter((p) => p.group === g.id).flatMap((p) => [
      `- [${p.de.nav}](${SITE_URL}${route(p.id, 'de')}): ${p.de.card}`,
      `- [${p.en.nav}](${SITE_URL}${route(p.id, 'en')}): ${p.en.card}`,
    ]), '']),
    '## About', `- [Rechenweg](${SITE_URL}${route('method', 'de')})`, `- [Method](${SITE_URL}${route('method', 'en')})`, `- [Über uns](${SITE_URL}${route('about', 'de')})`, `- [About](${SITE_URL}${route('about', 'en')})`,
  ];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
