# local-business-jsonld

Générateur JSON-LD schema.org LocalBusiness. Zéro dépendance runtime.

## Règles non négociables

- **Aucune dépendance runtime.** Toute proposition d'ajout dans `dependencies` doit
  être refusée et signalée. `devDependencies` et `peerDependencies` optionnelles OK.
- `schema-dts` est une devDependency de test uniquement. Ne jamais l'importer dans `src/`.
- TypeScript strict, pas de `any`. Les `as` sont limités à trois endroits, listés
  dans `docs/decisions.md` : `src/internal/`, le repli de `@type` dans les
  builders génériques, et le retour de `graph()`.
- **Pas de commentaire explicatif dans le code.** JSDoc d'une à deux lignes sur
  l'API publique, rien de plus. Ce qui mérite une explication va dans `docs/`,
  et les suppressions de règles de lint vont dans `biome.json`, pas en
  `biome-ignore` au fil du code.
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

## Commandes

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm test:types && pnpm build && pnpm check:package
```

`pnpm test:types` lance `vitest run --typecheck.only` (les `*.test-d.ts`).
`pnpm check:package` lance `attw --profile node16` : ESM, CJS et bundler. La
résolution `node10` est volontairement exclue, voir `docs/decisions.md`.

## Repères d'implémentation

- `src/internal/prune.ts` : seul endroit autorisé à supprimer des clés. Ordre des clés
  imposé (`@context`, `@type`, `@id`, puis alphabétique) pour des snapshots stables.
- `src/opening-hours/` : parse → merge. La fusion groupe les jours qui partagent
  **exactement** le même ensemble de créneaux. Sortie toujours lundi → dimanche.
- Convention Google « ouvert 24 h » : `opens: "00:00"`, `closes: "23:59"`.
- Convention Google « fermé ce jour-là » : `opens: "00:00"`, `closes: "00:00"`.
- Les horaires sont en heure locale de l'établissement. **Aucune gestion de fuseau.**

Fichiers ajoutés par rapport à l'arborescence du plan, chacun pour une raison :

- `src/builders/shared.ts` : mappeurs communs (adresse, geo, images, personne,
  avis, références). Évite trois versions divergentes de `buildAddress`.
- `src/internal/values.ts` : `toArray` et `joinList`.
- `src/internal/nodes.ts` : lecture et réécriture d'un nœud vu comme un sac de
  clés. **Tous les casts du paquet vivent ici ou dans `prune.ts`** — c'est ce qui
  permet à `builders/graph.ts` et `validate/` de rester typés de bout en bout.
- `src/internal/dev.ts` : `warnInDev`, lecture paresseuse de `NODE_ENV` via
  `globalThis` (pas de `@types/node` imposé aux consommateurs).
- `src/opening-hours/errors.ts` : les classes d'erreur, séparées pour que
  `days.ts` puisse lever sans dépendre de `parse.ts`.

`tsconfig.json` déclare `"types": ["node"]` **pour les tests seulement** (un test
lit des fichiers source). La règle Biome `noNodejsModules` est active sur `src/**`
pour que le paquet reste neutre côté plateforme.

## Écarts assumés

Documentés dans `docs/decisions.md`, avec la raison et ce que ça casserait de
changer d'avis : `@type` des horaires exceptionnels, `ListItem.item` en URL,
`ImageObject` sans dimensions, `VeterinaryCare` hors union, `paymentAccepted` en
chaîne, liste explicite des clés d'URL résolues par `graph()`, exclusion de
`node10`, et la taille réelle du bundle. **Les lire avant de « corriger » l'un
d'eux.**
