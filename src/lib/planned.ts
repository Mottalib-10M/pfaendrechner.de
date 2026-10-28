/** Toutes les pages prévues (id = nom du fichier de src/content/guides).
 *  Les tests acceptent un lien vers ces ids pendant la rédaction ; « toutes les pages existent » échoue tant qu'il en manque. */
export const PLANNED_GUIDES = [
  'pfaendungstabelle', 'tabelle-2027', 'tabelle-2025', 'freigrenze', 'freibetrag', 'einkommen', 'wochenlohn',
  'lohnpfaendung', 'arbeitgeber', 'sonderzahlungen', 'unterhaltspflichten', 'unterhaltspfaendung', 'mehrere-einkommen', 'selbststaendige', 'freibetrag-erhoehen',
  'p-konto', 'p-konto-freibetrag', 'p-konto-einrichten', 'p-konto-bescheinigung', 'p-konto-uebertrag', 'kontopfaendung', 'nachzahlung',
  'unpfaendbar', 'kindergeld', 'rente', 'sozialleistungen',
];
export const PLANNED_IDS = new Set<string>([...PLANNED_GUIDES, 'home', 'method', 'about', 'widget', 'contact', 'editorial', 'privacy', 'terms', 'cookies']);
