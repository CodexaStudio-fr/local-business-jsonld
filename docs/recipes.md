# Recettes

Trois cas réels, du plus simple au plus tordu. Chacune est copiable telle quelle.

---

## 1. Site d'artisan, une page

Le cas le plus fréquent : un plombier, un site vitrine de trois pages, une fiche
Google Business à alimenter. On veut un seul `<script>` qui décrit l'entreprise,
le site, le fil d'Ariane et la FAQ, tous reliés.

```tsx
// app/layout.tsx
import { breadcrumbs, faq, graph, localBusiness, website } from "local-business-jsonld";
import { JsonLd } from "local-business-jsonld/next";

const SITE = "https://plomberie-dupont.fr";

const business = localBusiness({
  type: "Plumber",
  id: "#business",
  name: "Plomberie Dupont",
  description: "Dépannage et installation sanitaire au Mans depuis 1998.",
  url: "/",
  telephone: "02 43 12 34 56",
  email: "contact@plomberie-dupont.fr",
  priceRange: "€€",
  paymentAccepted: ["Cash", "CreditCard", "CheckInAdvance"],
  currenciesAccepted: "EUR",
  // Google veut les trois ratios : 1:1, 4:3, 16:9.
  image: ["/og-1x1.jpg", "/og-4x3.jpg", "/og-16x9.jpg"],
  logo: "/logo.png",
  address: {
    street: "12 rue Nationale",
    city: "Le Mans",
    region: "Pays de la Loire",
    postalCode: "72000",
  },
  geo: { lat: 48.0061, lng: 0.1996 },
  hasMap: "https://maps.app.goo.gl/exemple",
  openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
  specialOpeningHours: [
    { from: "2026-08-01", to: "2026-08-15", closed: true }, // congés
    { date: "2026-12-25", closed: true },
  ],
  areaServed: ["Le Mans", "Sarthe", "Pays de la Loire"],
  sameAs: ["https://www.facebook.com/plomberiedupont", "https://g.page/plomberie-dupont"],
  founder: "Marc Dupont",
  foundingDate: "1998",
  vatID: "FR12345678901",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  const jsonLd = graph(
    { baseUrl: SITE },
    business,
    website({ id: "#website", url: "/", name: "Plomberie Dupont", inLanguage: "fr-FR", publisher: "#business" }),
    breadcrumbs([{ name: "Accueil", url: "/" }], { id: "#fil" }),
    faq(
      [
        { question: "Intervenez-vous en urgence ?", answer: "Oui, 7j/7, sous deux heures sur Le Mans." },
        { question: "Le déplacement est-il payant ?", answer: "Le devis est gratuit dans un rayon de 20 km." },
      ],
      { id: "#faq" },
    ),
  );

  return (
    <html lang="fr">
      <body>
        <JsonLd data={jsonLd} />
        {children}
      </body>
    </html>
  );
}
```

Ce qu'il faut remarquer :

- Les URLs sont **relatives** (`"/"`, `"/og-1x1.jpg"`). `graph({ baseUrl })` les
  résout toutes d'un coup — un seul endroit à changer quand le domaine change.
- `id: "#business"` est un fragment nu ; il devient
  `https://plomberie-dupont.fr/#business`, et `publisher: "#business"` pointe
  dessus.
- Le téléphone est saisi au format français et sort en `+33243123456`.

### Le brancher en test

```ts
import { validate } from "local-business-jsonld/validate";

it("le balisage de la page d'accueil est valide", () => {
  const { errors, warnings } = validate(jsonLd);
  expect(errors).toEqual([]);
  expect(warnings.map((issue) => issue.code)).toEqual([]);
});
```

Un test qui coûte trois lignes et rattrape une adresse vidée par un client dans
le CMS.

---

## 2. Restaurant

Deux différences avec l'artisan : les horaires sont plus découpés, et le
`@type` `Restaurant` accepte des propriétés que `LocalBusiness` n'a pas.

```ts
const restaurant = localBusiness({
  type: "Restaurant",
  id: "#business",
  name: "Le Bistrot du Marché",
  url: "/",
  telephone: "02 43 98 76 54",
  priceRange: "20-35 €",
  image: ["/salle-1x1.jpg", "/salle-4x3.jpg", "/salle-16x9.jpg"],
  address: { street: "3 place de la République", city: "Le Mans", postalCode: "72000" },
  geo: { lat: 48.0078, lng: 0.1996 },
  // Service midi et soir, fermé dimanche et lundi soir.
  openingHours: "Tu-Sa 12:00-14:30,19:00-22:30; Mo 12:00-14:30; Su off",
  knowsLanguage: ["fr", "en"],
  paymentAccepted: ["Cash", "CreditCard", "Restaurant Ticket"],
});
```

`"Tu-Sa 12:00-14:30,19:00-22:30; Mo 12:00-14:30; Su off"` sort trois specs :
mardi-samedi midi, mardi-samedi soir, lundi midi. Dimanche n'apparaît pas.

`servesCuisine` et `menu` ne sont pas dans les types d'entrée — ce paquet reste
sur le socle `LocalBusiness`. Pour les ajouter, étalez le nœud :

```ts
const jsonLd = {
  ...restaurant,
  servesCuisine: "Française",
  menu: "https://le-bistrot-du-marche.fr/carte",
  acceptsReservations: "https://le-bistrot-du-marche.fr/reserver",
};
```

C'est un objet JSON simple : rien n'empêche de l'enrichir. `serialize()` et
`graph()` l'acceptent tel quel.

### Les services comme nœuds séparés

```ts
import { graph, localBusiness, service } from "local-business-jsonld";

graph(
  { baseUrl: "https://le-bistrot-du-marche.fr" },
  restaurant,
  service({
    id: "#traiteur",
    name: "Service traiteur",
    serviceType: "Traiteur événementiel",
    provider: "#business",
    areaServed: ["Le Mans", "Sarthe"],
    offers: [
      { name: "Menu cocktail", price: 28, availability: "InStock" },
      { name: "Menu assis", price: 45 },
    ],
  }),
);
```

Le prix sort en chaîne avec `priceCurrency: "EUR"` par défaut, et `"InStock"`
devient `https://schema.org/InStock`.

---

## 3. Multi-établissements

Un réseau : une maison mère, plusieurs points de vente, chacun avec sa page. Le
piège est de donner le même `@id` à tous les établissements — Google fusionne
alors les fiches.

**Une page par établissement**, chacune avec son propre `@id` :

```ts
// lib/schema.ts
import { graph, localBusiness, organization } from "local-business-jsonld";

const SITE = "https://coiffure-atelier.fr";

/** La maison mère : un seul nœud, réutilisé sur toutes les pages. */
export const parent = organization({
  id: "#groupe",
  name: "Atelier Coiffure SAS",
  legalName: "ATELIER COIFFURE SAS",
  url: "/",
  logo: "/logo.png",
  vatID: "FR98765432109",
  foundingDate: "2011",
});

export interface Agence {
  slug: string;
  name: string;
  street: string;
  city: string;
  postalCode: string;
  telephone: string;
  lat: number;
  lng: number;
  openingHours: string;
}

export function agenceJsonLd(agence: Agence) {
  return graph(
    { baseUrl: SITE },
    parent,
    localBusiness({
      type: "HairSalon",
      // Un @id par établissement, dérivé du slug : jamais deux fiches confondues.
      id: `/${agence.slug}#business`,
      name: agence.name,
      url: `/${agence.slug}`,
      telephone: agence.telephone,
      priceRange: "€€",
      image: [`/${agence.slug}-1x1.jpg`, `/${agence.slug}-16x9.jpg`],
      address: { street: agence.street, city: agence.city, postalCode: agence.postalCode },
      geo: { lat: agence.lat, lng: agence.lng },
      openingHours: agence.openingHours,
      parentOrganization: "#groupe",
      areaServed: [agence.city],
    }),
  );
}
```

```tsx
// app/[slug]/page.tsx
import { JsonLd } from "local-business-jsonld/next";
import { agenceJsonLd, AGENCES } from "@/lib/schema";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agence = AGENCES.find((entry) => entry.slug === slug);
  if (!agence) return null;

  return <JsonLd data={agenceJsonLd(agence)} />;
}
```

Points clés :

- L'`@id` de chaque établissement contient le chemin de sa page :
  `https://coiffure-atelier.fr/le-mans-centre#business`. Deux salons ne peuvent
  pas se marcher dessus.
- `parentOrganization: "#groupe"` relie chaque salon à la maison mère, présente
  dans le même `@graph`.
- La page d'index (`/`) porte l'`Organization` seule, sans `LocalBusiness` :
  c'est la page du réseau, pas d'un lieu.

### Vérifier que rien ne pend

```ts
it("chaque agence référence bien la maison mère du graphe", () => {
  for (const agence of AGENCES) {
    const { errors, warnings } = validate(agenceJsonLd(agence));
    expect(errors).toEqual([]);
    expect(warnings.filter((issue) => issue.code === "dangling-reference")).toEqual([]);
  }
});
```

Le code `dangling-reference` attrape exactement ce bug-là : un
`parentOrganization: "#groupe"` alors que le nœud `#groupe` a été oublié dans
l'appel à `graph()`.

---

## Bonus : composer conditionnellement

`graph()` ignore les membres `undefined` et `null`. Pas besoin de
`filter(Boolean)` ni de tableaux intermédiaires :

```ts
graph(
  { baseUrl: SITE },
  business,
  website({ id: "#website", url: "/", publisher: "#business" }),
  page.breadcrumb ? breadcrumbs(page.breadcrumb, { id: "#fil" }) : undefined,
  page.faq?.length ? faq(page.faq, { id: "#faq" }) : undefined,
);
```

Et si vous préférez construire le tronc commun une fois pour toutes,
`graph()` aplatit les graphes imbriqués :

```ts
const commun = graph(business, website({ id: "#website", publisher: "#business" }));

// Sur une page intérieure :
graph({ baseUrl: SITE }, commun, breadcrumbs(etapes, { id: "#fil" }));
```
