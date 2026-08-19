/**
 * Tests de types. `schema-dts` est la référence de vérité sur ce qui est du
 * schema.org valide ; il n'est **jamais** importé depuis `src/` (§8.7).
 *
 * Ce fichier est la garantie que l'ergonomie de l'API ne s'est pas payée en
 * sortie invalide.
 */

import type {
  BreadcrumbList,
  FAQPage,
  LocalBusiness,
  Organization,
  Plumber,
  Restaurant,
  Review,
  Service,
  WebSite,
  WithContext,
} from "schema-dts";
import { expectTypeOf, test } from "vitest";
import { breadcrumbs } from "../src/builders/breadcrumbs.js";
import { faq } from "../src/builders/faq.js";
import { localBusiness } from "../src/builders/local-business.js";
import { organization } from "../src/builders/organization.js";
import { review } from "../src/builders/review.js";
import { service } from "../src/builders/service.js";
import { website } from "../src/builders/website.js";
import type { AnyLocalBusinessType, LocalBusinessType } from "../src/types/business-types.js";

/**
 * Extrait tous les `@type` littéraux présents sous `LocalBusiness` dans
 * schema-dts. Le membre `string` de l'union ne porte pas de `@type` et tombe
 * donc naturellement.
 */
type SchemaLocalBusinessTypeName = LocalBusiness extends infer Member
  ? Member extends { "@type": infer Name }
    ? Name
    : never
  : never;

test("chaque @type de l'union curée est un vrai sous-type de LocalBusiness", () => {
  expectTypeOf<LocalBusinessType>().toExtend<SchemaLocalBusinessTypeName>();
});

test("l'échappatoire laisse passer un @type hors union", () => {
  expectTypeOf<"Aquarium">().toExtend<AnyLocalBusinessType>();
});

test("une sortie minimale est assignable à WithContext<LocalBusiness>", () => {
  const node = localBusiness({ name: "Plomberie Dupont" });
  expectTypeOf(node).toExtend<WithContext<LocalBusiness>>();
});

test("une sortie complète est assignable à WithContext<Plumber>", () => {
  const node = localBusiness({
    type: "Plumber",
    id: "https://plomberie-dupont.fr/#business",
    name: "Plomberie Dupont",
    description: "Dépannage et installation sanitaire au Mans depuis 1998.",
    url: "https://plomberie-dupont.fr",
    telephone: "+33243123456",
    email: "contact@plomberie-dupont.fr",
    priceRange: "€€",
    currenciesAccepted: "EUR",
    paymentAccepted: ["Cash", "CreditCard", "CheckInAdvance"],
    image: [
      "https://plomberie-dupont.fr/og-1x1.jpg",
      { url: "https://plomberie-dupont.fr/og-16x9.jpg", caption: "Atelier" },
    ],
    logo: "https://plomberie-dupont.fr/logo.png",
    address: {
      street: "12 rue Nationale",
      city: "Le Mans",
      region: "Pays de la Loire",
      postalCode: "72000",
      country: "FR",
    },
    geo: { lat: 48.0061, lng: 0.1996 },
    hasMap: "https://maps.google.com/?cid=42",
    openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
    specialOpeningHours: [{ date: "2026-12-25", closed: true }],
    areaServed: ["Le Mans", "Sarthe"],
    knowsLanguage: ["fr", "en"],
    sameAs: ["https://www.facebook.com/plomberiedupont"],
    aggregateRating: { value: 4.8, count: 37, best: 5, worst: 1 },
    review: [{ author: "Claire M.", rating: 5, body: "Rapide.", datePublished: "2026-05-02" }],
    founder: { name: "Marc Dupont", jobTitle: "Gérant" },
    foundingDate: "1998",
    vatID: "FR12345678901",
    taxID: "12345678900012",
    parentOrganization: "#groupe",
  });

  expectTypeOf(node).toExtend<WithContext<Plumber>>();
  expectTypeOf(node).toExtend<WithContext<LocalBusiness>>();
});

test("le @type littéral remonte dans le type de retour", () => {
  const node = localBusiness({ type: "Restaurant", name: "Le Bistrot" });
  expectTypeOf(node["@type"]).toEqualTypeOf<"Restaurant">();
  expectTypeOf(node).toExtend<WithContext<Restaurant>>();
});

test("sans @type explicite, le retour est un LocalBusiness générique", () => {
  const node = localBusiness({ name: "X" });
  expectTypeOf(node["@type"]).toEqualTypeOf<"LocalBusiness">();
});

// ─────────────────────────────────────────────────────────────────────────────
// Builders secondaires
// ─────────────────────────────────────────────────────────────────────────────

test("website est assignable à WithContext<WebSite>", () => {
  const node = website({
    id: "#website",
    url: "https://x.fr",
    name: "Plomberie Dupont",
    inLanguage: "fr-FR",
    publisher: "#business",
    searchAction: "https://x.fr/recherche?q={search_term_string}",
  });
  expectTypeOf(node).toExtend<WithContext<WebSite>>();
});

test("organization est assignable à WithContext<Organization>", () => {
  const node = organization({
    id: "#groupe",
    name: "Groupe Dupont",
    url: "https://x.fr",
    logo: "https://x.fr/logo.png",
    address: { city: "Le Mans", postalCode: "72000" },
    sameAs: ["https://fb.com/x"],
    vatID: "FR12345678901",
    founder: "Marc Dupont",
  });
  expectTypeOf(node).toExtend<WithContext<Organization>>();
});

test("faq est assignable à WithContext<FAQPage>", () => {
  const node = faq([{ question: "Intervenez-vous en urgence ?", answer: "Oui, 7j/7." }]);
  expectTypeOf(node).toExtend<WithContext<FAQPage>>();
});

test("service est assignable à WithContext<Service>", () => {
  const node = service({
    id: "#depannage",
    name: "Dépannage plomberie",
    provider: "#business",
    areaServed: ["Le Mans"],
    offers: [{ name: "Déplacement", price: 60, availability: "InStock" }],
  });
  expectTypeOf(node).toExtend<WithContext<Service>>();
});

test("review est assignable à WithContext<Review>", () => {
  const node = review({ author: "Claire M.", rating: 5, body: "Rapide." });
  expectTypeOf(node).toExtend<WithContext<Review>>();
});

/**
 * Écart assumé : schema.org type `ListItem.item` en `Thing`, mais Google
 * documente — et son Rich Results Test attend — une URL en chaîne. On suit
 * Google, donc `itemListElement` est exclu de l'assertion. Tout le reste du
 * nœud est vérifié.
 */
test("breadcrumbs est assignable à BreadcrumbList, itemListElement excepté", () => {
  const node = breadcrumbs([{ name: "Accueil", url: "https://x.fr" }, { name: "Dépannage" }]);
  expectTypeOf(node).toExtend<WithContext<Omit<BreadcrumbList, "itemListElement">>>();
});
