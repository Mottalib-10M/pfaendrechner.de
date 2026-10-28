import type { Locale } from './routes';
const de = {
  updatedOn: 'Aktualisiert am', editorialPolicy: 'Redaktionsgrundsätze', contactLabel: 'Kontakt', reviewedBy: 'Erstellt von',
  skipToContent: 'Zum Inhalt springen', mainNav: 'Hauptnavigation', breadcrumbLabel: 'Brotkrumen', breadcrumbHome: 'Start', menuOpen: 'Menü öffnen',
  faqTitle: 'Häufige Fragen', relatedCalculators: 'Weiter mit', sourcesTitle: 'Gesetze und Bekanntmachungen zu dieser Seite', writtenBy: 'Erstellt von',
  asOf: 'Stand', lastUpdated: 'Tabellen und Gesetzestexte geprüft am', footerValidated: 'Quellen: Pfändungsfreigrenzenbekanntmachungen 2025 und 2026 im Bundesgesetzblatt, Zivilprozessordnung, SGB I, EStG auf gesetze-im-internet.de',
  footerBrowser: 'Alle Rechner laufen in Ihrem Browser · Ihre Angaben werden nicht gesendet und nicht gespeichert · kein Konto',
  footerDisclaimer: 'Unabhängige Seite von Radif Partners, ohne Verbindung zu einem Gericht, einem Ministerium, einer Bank oder einer Beratungsstelle. Die Ergebnisse sind unverbindlich und ersetzen weder den Pfändungsbeschluss noch eine Rechtsberatung.',
  footerPopular: 'Tabelle und Freibeträge',
  notFound: 'Unter dieser Adresse gibt es keine Seite. Auf der Startseite rechnen Sie den pfändbaren Betrag aus, darunter finden Sie die Tabelle 2026 und den P-Konto-Freibetrag.',
  readMore: 'Weiterlesen',
  moreOptions: 'Weitere Angaben', copyLink: 'Link kopieren', copied: 'Link kopiert', print: 'Drucken', howComputed: 'So wird gerechnet', openFull: 'Zum vollständigen Rechner',
};
const en: typeof de = {
  updatedOn: 'Updated on', editorialPolicy: 'Editorial policy', contactLabel: 'Contact', reviewedBy: 'Prepared by',
  skipToContent: 'Skip to content', mainNav: 'Main navigation', breadcrumbLabel: 'Breadcrumb', breadcrumbHome: 'Home', menuOpen: 'Open menu',
  faqTitle: 'Common questions', relatedCalculators: 'Keep going', sourcesTitle: 'Laws and official notices for this page', writtenBy: 'Prepared by',
  asOf: 'As of', lastUpdated: 'tables and statutes checked on', footerValidated: 'Sources: 2025 and 2026 exemption-limit notices in the Federal Law Gazette, Code of Civil Procedure, Social Code I and Income Tax Act on gesetze-im-internet.de',
  footerBrowser: 'Every calculator runs in your browser · nothing you enter is sent or stored · no account',
  footerDisclaimer: 'Independent site published by Radif Partners, not linked to any court, ministry, bank or advice service. The results do not replace the garnishment order and are not legal advice.',
  footerPopular: 'Table and allowances',
  notFound: 'Nothing lives at this address. The home page works out the attachable amount; below it you find the 2026 table and the P-account allowance.',
  readMore: 'Read more',
  moreOptions: 'More details', copyLink: 'Copy share link', copied: 'Link copied', print: 'Print', howComputed: 'How this is calculated', openFull: 'Open the full calculator',
};
const ALL = { de, en };
export function t(lang: Locale) { return ALL[lang] ?? de; }
