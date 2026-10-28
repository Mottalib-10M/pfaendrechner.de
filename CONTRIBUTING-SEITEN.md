# Ajouter ou étoffer une page du Pfändungsrechner

Cette notice s'adresse aux agents qui prolongent le site. Lisez-la en entier avant d'écrire, avec `~/Documents/GitHub/RECETTE-SITE.md` (§0, §3, §6, §7, §9.3, §11, §21, §26).

## Principe

Une page = **un fichier** `src/content/guides/<id>.ts` (`defineGuide`). Ce fichier porte l'allemand (`de`) et l'anglais (`en`) côte à côte : slug, titre, description, H1, chapeau, bloc citable (`resume`), FAQ, corps, sources, outil de tête (`tool`, `toolArg`) et pages liées. L'`id` est le nom du fichier ; il doit figurer dans `src/lib/planned.ts`.

Routes, menus, sitemap, hreflang, `llms.txt` et schémas lisent ces fichiers : **ne touchez à aucun fichier du cœur pour ajouter une page.** Budget : 100 pages HTML au total (26 guides × 2 langues, plus 2 accueils, 16 pages de service et 4 pages `/embed/`).

Modèle à suivre : `src/content/guides/pfaendungstabelle.ts`.

## Les outils

Tous sont déclaratifs, dans `src/lib/tool-specs.ts`, rendus par `calc/SpecTool.tsx`. Ce sont aussi les seuls admis en mini-simulateur (`h.mini(kind, { p: [ids des champs], d: {valeurs}, c: 'texte du lien' })`).

| `tool` | Rôle |
|---|---|
| `rechner` (+ `toolArg.quelle` = `rente`, `toolArg.periode`) | Pfändungsrechner : net, personnes, période, table |
| `tabelle` | Extrait de la table officielle autour du net, 6 colonnes |
| `vergleich`, `prognose` | 2025 contre 2026 ; hypothèse saisie pour la table 2027 (jamais présentée comme officielle) |
| `grenze`, `freibetrag`, `personen` | Seuil de saisie, franchise, effet des personnes à charge |
| `netto`, `sonder` | Net saisissable § 850e / § 850a ; prime de Noël |
| `dauer`, `lohnfrist`, `unterhalt`, `mehrere`, `selbst`, `bedarf` | Durée, délai § 840, § 850d (montant du jugement), § 850e Nr. 2, § 850i, § 850f |
| `pkonto`, `pkontotab`, `pfrist`, `bescheinigung`, `uebertrag`, `kfrist`, `nachzahlung` | Compte P : montant protégé, tableau 2025/2026, dates de conversion, attestation, report, saisie de compte, rappels |
| `unpfaendbar`, `kindergeld`, `sozial` | Revenus protégés, allocations familiales, prestations SGB II |

Le moteur est `src/lib/engine/pfaendung.ts` (fonctions pures, en centimes). **Il reproduit sans écart les six tableaux officiels** (2025 et 2026, mensuel, hebdomadaire, journalier), lus dans le Bundesgesetzblatt et rangés dans `tests/fixtures/` : `tests/engine.test.ts` compare chaque ligne. Pâques (Gauss/Meeus), fériés nationaux, délais § 188 BGB et § 222 ZPO, jours ouvrés bancaires y sont aussi.

**Rien n'est envoyé ni stocké** : aucun outil ne fait de requête réseau avec une saisie.

## Les données

`src/data/params-2026.json` : les trois barèmes (2024, 2025, 2026) avec date et référence au BGBl., les quotes, le Kindergeld (§ 66 EStG), la part protégée de l'Elterngeld, les délais du compte P, et les **sources** (clés utilisées par `sources` et `h.src`). Tout chiffre d'une page vient de là ou du moteur (`K.P`, `K.pfaendbar`, `h.eur`, `h.day`), jamais tapé à la main.

## Rédaction

- Titre 50 à 60 caractères avec « 2026 », terme clé d'abord ; description 150 à 160 ; `resume` = un seul paragraphe de 120 mots ou plus ; 3 à 5 FAQ de 40 à 90 mots, chaque question unique sur le site ; corps de 300 mots de prose au moins, avec au moins un `h.mini`.
- Interdits (`tests/pages.test.ts`) : tirets longs, le mot « null » (même en allemand : écrire « keine », « 0 »), noms de concurrents ou de moteurs de recherche, « garantiert », « Bürgergeld » sans « früher » (la prestation s'appelle Grundsicherungsgeld depuis la réforme du SGB II), tournures creuses (« darüber hinaus », « zudem », « Moreover »…).
- Anglais : pour un expatrié qui vit en Allemagne ; les termes allemands utiles (Pfändungsschutzkonto, Pfändungs- und Überweisungsbeschluss) sont gardés et expliqués.
- Aucun renvoi vers un conseiller, une agence de désendettement, un avocat ou un formulaire ; on cite la loi, pas un prestataire.

## Mise à jour

1. Au printemps 2027, le ministère publie la Pfändungsfreigrenzenbekanntmachung 2027 (en vigueur au 1er juillet 2027). Ajouter le bloc `2027` dans `tabellen`, télécharger le texte officiel (recht.bund.de, archive ZIP du BGBl.), le convertir avec `scripts/tabelle-einlesen.py` dans `tests/fixtures/tabelle-2027.json`, étendre `TabJahr` et `tabelleAm`, relancer `npx vitest run`.
2. Kindergeld : relire § 66 EStG chaque 1er janvier.
3. Après chaque modification : `npm run check` (0 défaut attendu).
