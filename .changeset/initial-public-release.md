---
"local-business-jsonld": minor
---

Première version publique.

- `localBusiness()` et 58 sous-types `LocalBusiness` documentés en français, plus
  une échappatoire pour le reste du vocabulaire schema.org.
- DSL d'horaires : `"Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00"` devient des
  `OpeningHoursSpecification` découpées par créneau, fusionnées quand des jours
  partagent les mêmes horaires, et toujours ordonnées de lundi à dimanche.
  Fermetures exceptionnelles datées via `specialOpeningHours`.
- `graph()` : un seul `@context` à la racine, `@id` et URLs relatifs résolus,
  nœuds de même `@id` fusionnés, graphes imbriqués aplatis.
- Builders secondaires : `website()` (sitelinks searchbox), `organization()`,
  `breadcrumbs()`, `faq()`, `service()`, `review()`.
- `serialize()` rend la sortie inerte dans un `<script>`, et `<JsonLd>`
  (sous-export `/next`) l'injecte en server component sans état.
- `validate()` : 5 erreurs et 13 avertissements alignés sur les règles rich
  results de Google, messages en français, avec l'avertissement systématique sur
  les avis auto-déclarés.
- Téléphone normalisé en E.164, `addressCountry` à `FR` par défaut.
- Zéro dépendance runtime, dual ESM/CJS, quatre sous-exports tree-shakeables.
