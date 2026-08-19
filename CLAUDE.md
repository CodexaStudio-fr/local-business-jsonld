# local-business-jsonld

Générateur JSON-LD schema.org LocalBusiness. Zéro dépendance runtime.

## Règles non négociables

- **Aucune dépendance runtime.** Toute proposition d'ajout dans `dependencies` doit
  être refusée et signalée. `devDependencies` et `peerDependencies` optionnelles OK.
- `schema-dts` est une devDependency de test uniquement. Ne jamais l'importer dans `src/`.
- TypeScript strict, pas de `any`, pas de `as` sauf dans `internal/` avec commentaire justificatif.
- Toute sortie JSON-LD doit être assignable à `WithContext<LocalBusiness>` (test de types).
- Le composant `<JsonLd>` est un server component : aucun hook, aucun `"use client"`.
- Toute chaîne interpolée dans un `<script>` passe par `serialize()` (échappement `<`, `>`, `&`).
- Propriétés `undefined` élaguées récursivement avant sérialisation. Jamais de `null` en sortie.

## Workflow

- TDD sur `src/opening-hours/` : les tests existent déjà, ne pas les modifier pour
  les faire passer. Si un test semble faux, le signaler au lieu de l'éditer.
- Un changeset par PR (`pnpm changeset`).
- `pnpm lint && pnpm test && pnpm test:types && pnpm check:package` avant tout commit.

## Ce qu'il ne faut pas faire

- Ajouter des `@type` schema.org exotiques « pour être exhaustif ». L'union est curée
  volontairement ; l'escape hatch `(string & {})` couvre le reste.
- Refactorer l'API publique sans mise à jour de README.md + docs/ + examples/.
- Élargir le scope vers Product / Event / Recipe. Ce package fait LocalBusiness.

## Repères d'implémentation

- `src/internal/prune.ts` : seul endroit autorisé à supprimer des clés. Ordre des clés
  imposé (`@context`, `@type`, `@id`, puis alphabétique) pour des snapshots stables.
- `src/opening-hours/` : parse → merge. La fusion groupe les jours qui partagent
  **exactement** le même ensemble de créneaux. Sortie toujours lundi → dimanche.
- Convention Google « ouvert 24 h » : `opens: "00:00"`, `closes: "23:59"`.
- Convention Google « fermé ce jour-là » : `opens: "00:00"`, `closes: "00:00"`.
- Les horaires sont en heure locale de l'établissement. **Aucune gestion de fuseau.**
