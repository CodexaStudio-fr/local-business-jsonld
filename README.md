# @codexastudio/local-business-jsonld

Générateur JSON-LD `LocalBusiness` typé pour schema.org. **Zéro dépendance runtime.**

> Documentation et messages d'erreur en français. L'API, elle, est en anglais —
> les noms suivent schema.org.

```bash
pnpm add @codexastudio/local-business-jsonld
```

```tsx
import { localBusiness } from "@codexastudio/local-business-jsonld";
import { JsonLd } from "@codexastudio/local-business-jsonld/next";

const jsonLd = localBusiness({
  type: "Plumber",
  name: "Plomberie Dupont",
  url: "https://plomberie-dupont.fr",
  telephone: "02 43 12 34 56", // normalisé en +33243123456
  priceRange: "€€",
  address: { street: "12 rue Nationale", city: "Le Mans", postalCode: "72000" },
  geo: { lat: 48.0061, lng: 0.1996 },
  openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
});

export default function Page() {
  return <JsonLd data={jsonLd} />;
}
```

Ces vingt lignes produisent un `LocalBusiness` complet, `@id` inclus, avec
**trois** `OpeningHoursSpecification` correctement découpées et fusionnées.

---

## Pourquoi celui-là

`next-seo` sait déjà cracher un `LocalBusinessJsonLd`, et `schema-dts` type déjà
tout schema.org. Ce paquet ne comble pas un vide : c'est un **wrapper
d'ergonomie** sur quatre points précis.

### 1. Le DSL d'horaires

Le format est celui d'OpenStreetMap, familier et compact :

```ts
openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00";
```

Il sort trois `OpeningHoursSpecification` : deux pour la semaine (une par
créneau, comme l'exige schema.org), une pour le samedi. Les jours qui partagent
**exactement** les mêmes créneaux sont regroupés en une seule spec, et sortent
toujours de lundi à dimanche.

`"24/7"`, `"Su off"`, `"Fr-Mo 09:00-18:00"` (wrap-around), `"Th 22:00-02:00"`
(chevauchement de minuit) fonctionnent. Une règle plus tardive **remplace** les
créneaux des jours qu'elle nomme, ce qui rend
`"Mo-Fr 09:00-18:00; We off"` et `"Mo-Fr 09:00-18:00; Fr 09:00-12:00"` naturels.
Les cas limites sont tous couverts par `test/opening-hours.test.ts`, qui vaut
table de référence.

### 2. La composition en `@graph`

Un seul `<script>`, tous les nœuds reliés par `@id` :

```ts
import { breadcrumbs, faq, graph, localBusiness, website } from "@codexastudio/local-business-jsonld";

const jsonLd = graph(
  { baseUrl: "https://plomberie-dupont.fr" },
  localBusiness({ id: "#business", name: "Plomberie Dupont" /* … */ }),
  website({ id: "#website", url: "/", publisher: "#business" }),
  breadcrumbs([{ name: "Accueil", url: "/" }, { name: "Dépannage" }], { id: "#fil" }),
  faq([{ question: "Intervenez-vous en urgence ?", answer: "Oui, 7j/7." }], { id: "#faq" }),
);
```

`graph()` hisse le `@context` à la racine et le retire des enfants — l'erreur
classique qui fait recaler un `@graph` chez Google. Il résout les `@id` et les
URLs relatifs contre `baseUrl`, fusionne les nœuds de même `@id`, et ignore les
membres `undefined` pour composer conditionnellement :

```ts
graph(business, page.faq ? faq(page.faq) : undefined);
```

### 3. Zéro dépendance runtime, tree-shakeable

| Import | gzip |
| --- | --- |
| `serialize` seul | 515 B |
| `parseOpeningHours` seul | 1,7 kB |
| `localBusiness` seul | 4,5 kB |
| `localBusiness` + `graph` + `serialize` | 5,3 kB |
| `validate` (sous-export séparé) | 2,9 kB |

### 4. Ergonomie FR/EU

- Union curée de **58 `@type`** documentés en français (`Plumber`,
  `Electrician`, `HairSalon`, `Notary`…), avec échappatoire pour le reste.
- Téléphone normalisé en E.164 depuis un format national, `FR` par défaut.
- `addressCountry` à `"FR"` par défaut, `defaultCountry` pour changer.
- Messages de `validate()` en français, chacun nommant sa propriété.

---

## API

### Builders

| Fonction | Nœud produit |
| --- | --- |
| `localBusiness(input, options?)` | `LocalBusiness` et ses 58 sous-types |
| `website(input, options?)` | `WebSite`, sitelinks searchbox incluse |
| `organization(input, options?)` | `Organization` |
| `breadcrumbs(items, options?)` | `BreadcrumbList` |
| `faq(items, options?)` | `FAQPage` |
| `service(input, options?)` | `Service` et ses offres |
| `review(input, options?)` | `Review` |
| `graph(options?, ...nodes)` | document `@graph` |

Chaque builder renvoie un nœud **avec son `@context`** : utilisable seul dans un
`<script>`. Passé à `graph()`, le `@context` est hissé.

Les propriétés `undefined` sont élaguées récursivement, les chaînes trimées, les
clés ordonnées (`@context`, `@type`, `@id`, puis alphabétique) — les snapshots ne
flappent pas.

### Rendu

```tsx
import { JsonLd } from "@codexastudio/local-business-jsonld/next";

<JsonLd data={jsonLd} id="ld-business" nonce={nonce} />;
```

Server component sans état : aucun hook, aucun `"use client"`, aucun risque
d'hydratation. Rien n'est spécifique à Next — n'importe quel rendu React marche.

Hors React :

```ts
import { serialize } from "@codexastudio/local-business-jsonld";

const html = `<script type="application/ld+json">${serialize(jsonLd)}</script>`;
```

`serialize()` réécrit `<`, `>`, `&`, U+2028 et U+2029 en échappements Unicode.
C'est du JSON valide — `JSON.parse` restitue les caractères — mais inerte en
HTML : un `name` contenant `</script>` ne peut plus casser la page ni ouvrir une
XSS. **N'interpolez jamais du JSON-LD dans un `<script>` sans passer par là.**

### Validation

```ts
import { validate } from "@codexastudio/local-business-jsonld/validate";

const { valid, errors, warnings } = validate(jsonLd);
```

- `errors` — bloque les rich results : `name` et `address` manquants,
  `@context` absent, note incohérente.
- `warnings` — recommandé par Google, ou piège connu : `image`, `telephone`,
  `url`, `geo`, `openingHoursSpecification`, `priceRange`, adresse incomplète,
  `@id` sans fragment, téléphone hors E.164, fermeture à `24:00`, référence
  `@id` pendante dans un `@graph`.

Chaque problème porte un `code` stable, la `property` visée, le `nodeId`
concerné et un message en français. À brancher en test :

```ts
it("le balisage de la page artisan est valide", () => {
  expect(validate(jsonLd).errors).toEqual([]);
});
```

---

## ⚠️ `aggregateRating` : lisez ceci avant de l'utiliser

**Google n'accepte pas, pour les rich results, les avis collectés et affichés
par l'entreprise sur sa propre page.** Un `aggregateRating` renseigné à la main,
sans source vérifiable, sera au mieux ignoré, au pire retenu contre le site.

`validate()` émet donc un avertissement `self-declared-rating` **dès que**
`aggregateRating` ou `review` est présent, même parfaitement formé. Ce n'est pas
un faux positif : c'est un rappel que la donnée doit venir d'une plateforme
tierce.

---

## Fuseaux horaires : non gérés, et c'est voulu

schema.org exprime les horaires d'ouverture en **heure locale de
l'établissement**, sans fuseau. `"09:00"` veut dire « neuf heures là-bas ». Ce
paquet n'invente donc aucun fuseau, ne convertit rien, et n'a pas de dépendance
à un moteur de dates. Si votre établissement change d'heure, c'est le panneau
sur la porte qui change, pas le balisage.

---

## Sous-exports

| Export | Contenu | Peer deps |
| --- | --- | --- |
| `.` | builders, `graph`, `serialize`, types | aucune |
| `./next` | `<JsonLd>` | `react` (optionnelle) |
| `./validate` | `validate()` et son catalogue | aucune |
| `./opening-hours` | `parseOpeningHours` seul | aucune |

Dual ESM/CJS, `.d.ts` et `.d.cts`. Vérifié en CI par `publint` et
`@arethetypeswrong/cli` (profil `node16` : ESM, CJS et bundler).

Le `dist` construit est exécuté en CI sur **Node 18, 20, 22 et 24**, en ESM comme
en CJS, sans installer quoi que ce soit — c'est le corollaire du zéro dépendance
runtime. La chaîne d'outils, elle, demande Node 22.13 ou plus, parce que pnpm 11
le demande.

---

## Pour aller plus loin

- [examples/next-app](./examples/next-app) — App Router minimal, une page
  artisan : composition du `@graph`, `<JsonLd>` dans le layout, et le rapport de
  `validate()` affiché dans la page.
- `test/opening-hours.test.ts` — le tableau de cas du DSL, exhaustif.
- Les JSDoc de l'API : les types d'entrée documentent chaque champ et les
  58 sous-types métier portent leur libellé français.

## Statut

`0.x`. L'API publique peut encore bouger. Utilisé en production sur des sites
clients CodexaStudio avant `1.0.0`.

## Licence

MIT
