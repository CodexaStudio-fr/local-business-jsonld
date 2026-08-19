# Migrer depuis `next-seo/jsonld`

`next-seo` reste un bon paquet, et sa couverture schema.org est bien plus large
que celle-ci. Migrez seulement si vous voulez le DSL d'horaires, la composition
en `@graph`, ou vous débarrasser d'une dépendance runtime — pas par principe.

Les deux peuvent cohabiter : `next-seo` pour `Product` ou `Article`, ce paquet
pour le `LocalBusiness`. Attention alors à ne pas déclarer deux fois la même
entité.

## Ce qui change vraiment

| | `next-seo/jsonld` | `local-business-jsonld` |
| --- | --- | --- |
| Forme | composant qui rend un `<script>` | fonction qui rend un objet, plus un composant de rendu |
| Horaires | tableau d'objets `{ dayOfWeek, opens, closes }` écrit à la main | DSL `"Mo-Fr 08:00-12:00,14:00-18:00"` |
| Plusieurs entités | une balise `<script>` par composant | un `@graph` dans une seule balise |
| Liaison par `@id` | à la main | `graph()` résout et vérifie |
| Dépendances runtime | la lib SEO complète | aucune |
| Validation | aucune | `validate()`, messages français |
| Portée | tout schema.org | `LocalBusiness` et son voisinage |

Différence de fond : `next-seo` **rend**, ce paquet **construit**. Vous gardez
l'objet en main, donc vous pouvez le tester, le journaliser, l'étaler pour
ajouter une propriété hors périmètre.

## Correspondance des propriétés

### `LocalBusinessJsonLd`

| `next-seo` | ici |
| --- | --- |
| `type` | `type` (union curée de 58 sous-types, échappatoire libre) |
| `id` | `id` — le fragment `#business` est ajouté s'il manque |
| `name`, `description`, `url`, `telephone`, `email` | identiques |
| `address.streetAddress` | `address.street` |
| `address.addressLocality` | `address.city` |
| `address.addressRegion` | `address.region` |
| `address.postalCode` | `address.postalCode` |
| `address.addressCountry` | `address.country` — `"FR"` par défaut |
| `geo.latitude` / `geo.longitude` | `geo.lat` / `geo.lng` |
| `images` | `image` — une chaîne suffit, elle est enveloppée |
| `openingHours: [{ dayOfWeek, opens, closes, validFrom, validThrough }]` | `openingHours` (DSL) et `specialOpeningHours` (dates) |
| `rating.ratingValue` / `rating.ratingCount` | `aggregateRating.value` / `.count` |
| `review` | `review: [{ author, rating, body, datePublished }]` |
| `areaServed` (objets `GeoCircle`) | `areaServed: string[]` (communes, départements) |
| `makesOffer` | builder `service()` séparé, relié par `@id` |
| `sameAs` | identique |
| `priceRange`, `currenciesAccepted`, `paymentAccepted` | identiques ; `paymentAccepted` accepte un tableau, joint par `", "` |

### Les horaires, avant / après

```tsx
// next-seo
<LocalBusinessJsonLd
  openingHours={[
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "12:00" },
    { dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "14:00", closes: "18:00" },
    { dayOfWeek: ["Saturday"], opens: "09:00", closes: "12:00" },
  ]}
/>
```

```ts
// ici
localBusiness({ openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00" });
```

La sortie est la même, à ceci près que la fusion regroupe les jours identiques
et réordonne toujours de lundi à dimanche.

### Les fermetures exceptionnelles

```tsx
// next-seo : mélangées dans openingHours, avec validFrom/validThrough
openingHours={[{ opens: "00:00", closes: "00:00", validFrom: "2026-12-25", validThrough: "2026-12-25" }]}
```

```ts
// ici : une propriété dédiée, qui alimente specialOpeningHoursSpecification
localBusiness({ specialOpeningHours: [{ date: "2026-12-25", closed: true }] });
```

### `SiteLinksSearchBoxJsonLd` et `LogoJsonLd`

Fondus dans `website()` et `organization()` :

```ts
website({
  id: "#website",
  url: "https://x.fr",
  publisher: "#business",
  searchAction: "https://x.fr/recherche?q={search_term_string}",
});
```

Le gabarit **doit** contenir `{search_term_string}` : sinon `website()` lève une
`TypeError` plutôt que d'émettre une searchbox muette.

### `BreadcrumbJsonLd` et `FAQPageJsonLd`

```ts
breadcrumbs([
  { name: "Accueil", url: "https://x.fr" },
  { name: "Services", url: "https://x.fr/services" },
  { name: "Dépannage" }, // page courante : `url` omise
]);

faq([{ question: "…", answer: "…" }]);
```

Les `position` sont numérotées automatiquement. Une liste vide lève une
`TypeError` : un `itemListElement` vide est du balisage invalide, autant le
savoir tout de suite.

## Le vrai gain : une seule balise

Avant, quatre `<script>` déconnectés :

```tsx
<LocalBusinessJsonLd … />
<SiteLinksSearchBoxJsonLd … />
<BreadcrumbJsonLd … />
<FAQPageJsonLd … />
```

Après, un `@graph` où le site sait qui l'édite :

```tsx
<JsonLd
  data={graph(
    { baseUrl: "https://x.fr" },
    localBusiness({ id: "#business", … }),
    website({ id: "#website", url: "/", publisher: "#business" }),
    breadcrumbs(etapes, { id: "#fil" }),
    faq(questions, { id: "#faq" }),
  )}
/>
```

## Pendant la migration

1. Gardez les deux paquets, page par page.
2. Sur chaque page migrée, retirez les composants `next-seo` correspondants —
   deux `LocalBusiness` sur la même page, c'est une entité ambiguë pour Google.
3. Branchez `validate()` en test pour comparer l'ancien et le nouveau balisage.
4. Repassez au Rich Results Test avant de retirer `next-seo` du
   `package.json` : c'est le seul juge qui compte.
