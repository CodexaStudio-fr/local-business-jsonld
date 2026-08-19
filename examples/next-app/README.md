# Exemple : page d'artisan (App Router)

Une page, quatre nœuds JSON-LD, une seule balise `<script>`.

```bash
pnpm install --ignore-workspace
pnpm dev
```

Le paquet est lié en local (`file:../..`), donc **construisez-le d'abord** depuis
la racine du dépôt :

```bash
pnpm build
```

## Ce que l'exemple montre

- [`lib/business.ts`](./lib/business.ts) — les données de l'établissement et la
  composition du `@graph`. URLs relatives, résolues d'un coup par `baseUrl` :
  une seule constante à changer pour rebrancher tout le balisage.
- [`app/layout.tsx`](./app/layout.tsx) — `<JsonLd>` dans le layout. Server
  component, aucune hydratation.
- [`app/page.tsx`](./app/page.tsx) — le contenu visible, **le rapport de
  `validate()`** et le JSON-LD indenté, pour voir ce qui part réellement dans la
  page.

Le panneau de contrôle est là pour rendre l'exemple auto-démonstratif. Dans un
vrai projet, ce contrôle vit dans un test :

```ts
expect(validate(buildJsonLd()).errors).toEqual([]);
```

## Vérifier chez Google

`SITE_URL` pointe sur un domaine `.example`, qui n'existe pas. Pour passer les
validateurs officiels :

1. Remplacez `SITE_URL` dans `lib/business.ts` par l'URL de votre déploiement.
2. Déployez (`vercel`, `netlify`, n'importe quoi qui serve du statique).
3. Passez l'URL dans le [Rich Results Test](https://search.google.com/test/rich-results)
   et le [Schema Markup Validator](https://validator.schema.org/).

Tant que ces deux outils ne sont pas verts, les tests unitaires ne prouvent rien
sur le rendu réel : ils vérifient la forme, pas l'interprétation.
