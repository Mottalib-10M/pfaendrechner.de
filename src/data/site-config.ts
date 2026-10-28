/** Configuration centrale du site (générée par new-site.py). */
export const SITE_URL = "https://de-pfaendung.example";
export const SITE_NAMES: Record<string, string> = {"de": "DE Pfändung", "en": "DE Pfändung"};
// Partie du nom affichée en couleur dans l'en-tête (RECETTE §10.3), « » pour aucune.
export const BRAND_ACCENT = "";
export const LANG_TAGS: Record<string, string> = {"de": "de-DE", "en": "en-DE"};
/** Locale des nombres et des dates : anglais britannique pour la version anglaise. */
export const NUM_TAGS: Record<string, string> = {"de": "de-DE", "en": "en-GB"};
export const OG_LOCALES: Record<string, string> = {"de": "de_DE", "en": "en_GB"};
export const LOCALE_TAG = 'de-DE';
export const CURRENCY = 'EUR';
export const YEAR = 2026;
/** Année de création du site — signal d'ancienneté (RECETTE §8.0). */
export const SITE_FOUNDED = '2026';
export const LAST_UPDATED = '2026-10-28';
export const AUTHOR_NAME = 'Radif Partners';
export const AUTHOR_ROLE: Record<string, string> = {"de": "Herausgeber eines kostenlosen Pfändungsrechners: pfändbarer Betrag nach § 850c ZPO, P-Konto-Freibetrag nach §§ 899 und 902 ZPO, amtliche Tabellen, alles im Browser", "en": "Publisher of a free German wage and account garnishment calculator: attachable amount under section 850c ZPO, P-account allowance under sections 899 and 902 ZPO, official tables, all in the browser"};
export const AUTHOR_DESC: Record<string, string> = {"de": "Radif Partners ist ein unabhängiger Herausgeber. Für den Pfändungsrechner liest es die §§ 850 bis 850k und 899 bis 907 der Zivilprozessordnung, § 54 SGB I, § 76 EStG und die Pfändungsfreigrenzenbekanntmachungen 2025 und 2026 im Bundesgesetzblatt und prüft den eigenen Rechenweg Zeile für Zeile gegen die amtlichen Tabellen. Radif Partners ist kein Gericht, keine Schuldnerberatung und keine Kanzlei und gibt keine Rechtsberatung.", "en": "Radif Partners is an independent publisher. For the Pfändungsrechner it reads sections 850 to 850k and 899 to 907 of the German Code of Civil Procedure, section 54 of Social Code I, section 76 of the Income Tax Act and the 2025 and 2026 exemption-limit notices in the Federal Law Gazette, and checks its own arithmetic line by line against the official tables. It is not a court, a debt advice service or a law firm and gives no legal advice."};
/** Sujets sur lesquels l'editeur est competent (schema.org knowsAbout). Ce sont les
 *  themes reellement traites par le site, pas une liste de mots-cles : un sujet
 *  declare ici sans page qui le couvre est une declaration fausse. */
export const KNOWS_ABOUT: Record<string, string[]> = {"de": ["Pfändungstabelle nach § 850c ZPO", "Pfändungsschutzkonto (P-Konto)", "Lohnpfändung", "Kontopfändung", "Unterhaltspfändung nach § 850d ZPO", "Pfändungsschutz für Kindergeld und Sozialleistungen"], "en": ["German wage garnishment table", "Pfändungsschutzkonto (P-account)", "Wage garnishment in Germany", "Bank account garnishment in Germany", "Maintenance garnishment"]};
export const CONTACT_EMAIL = "kontakt@de-pfaendung.example";
export const THEME_COLOR = '#1F5C4A';
export const LOGO_SYMBOL = 'Pf';
export const BING_VERIFY_CODE = '';
export const GOOGLE_VERIFY_CODE = '';
/** Régime : 'none' pour tous les sites (RECETTE §15.6, décision de l'éditeur du 2026-10-06) :
 *  aucun bandeau ; Clarity chargé en mode sans cookie (consentv2 denied) ; GA4 avec cookies si GA4_ID.
 *  'opt-in' / 'notice' ne servent plus qu'aux sites anciens qui les portent encore. */
export const CONSENT_MODE: 'opt-in' | 'notice' | 'none' = 'none';
/** Propriété Google Analytics 4 (décision de l'éditeur du 2026-10-17, RECETTE §15.6) : GA4 normal,
 *  avec cookies _ga / _ga_<ID> (390 jours), sans bandeau, publicité refusée. Créée par
 *  `seo-platform/scripts/create-ga4.ts accounts/372759688` (RECETTE §15.3, étape 15), puis
 *  pages légales régénérées : `python3 scripts/gen-legal-pages.py .`. Vide = pas de GA4. */
export const GA4_ID = '';
/** Projet Microsoft Clarity (compte amradif), chargé sans cookie. Vide = aucune mesure. */
export const CLARITY_ID = '';
export const INDEXNOW_KEY = '160a7e7a6267630bebd7f50a2949bb3c';

/* ------------------------------------------------------------------------- *
 * IDENTITÉ LÉGALE — À COMPLÉTER AVANT LA MISE EN LIGNE
 * Ces champs alimentent la mention légale du pays, la politique de confidentialité,
 * la page contact et le schema Organization. Un champ vide s'affiche en jaune
 * sur le site. Contrôle : `npm run check:legal`.
 * ------------------------------------------------------------------------- */
export interface LegalHosting { name: string; address: string; phone: string; url: string }
export interface LegalIdentity {
  entityName: string; legalForm: string; street: string; postalCode: string; city: string;
  country: string; phone: string; registerLabel: string; registerNumber: string;
  vatLabel: string; vatNumber: string; jurisdiction: string;
  supervisoryAuthority: string; supervisoryAuthorityUrl: string; hosting: LegalHosting;
}
export const LEGAL: LegalIdentity = {
  entityName: 'Radif Partners',  // éditeur de tous les sites du portefeuille (RECETTE §8)
  legalForm: '',  // vide : comme les autres sites du portefeuille
  street: '49 rue du Ressort',
  postalCode: '63000',
  city: 'Clermont-Ferrand',
  country: "Frankreich / France",
  phone: '',                 // ligne de contact publiée
  registerLabel: "SIREN",
  registerNumber: '',
  vatLabel: "USt-IdNr.",
  vatNumber: '',             // laisser vide si non assujetti
  jurisdiction: "France",
  supervisoryAuthority: "Commission nationale de l'informatique et des libertés (CNIL)",
  supervisoryAuthorityUrl: "https://www.cnil.fr",
  hosting: { name: 'GitHub, Inc. (GitHub Pages)', address: '88 Colin P Kelly Jr Street, San Francisco, CA 94107, United States', phone: '', url: 'https://pages.github.com' },
};

/** Champs sans lesquels le site ne doit pas être mis en ligne. */
export const LEGAL_REQUIRED: Array<keyof LegalIdentity> = ['entityName', 'street', 'postalCode', 'city']; // legalForm vide à dessein, comme les autres sites du portefeuille

/** Profils publics de l'auteur (schema.org sameAs). Laisser vide si aucun. */
export const AUTHOR_SAME_AS: string[] = [];

/** Rythme de revue éditoriale annoncé sur le site, en mois. */
export const REVIEW_CYCLE_MONTHS = 12;
