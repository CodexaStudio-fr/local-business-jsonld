import {
  breadcrumbs,
  faq,
  graph,
  localBusiness,
  website,
} from "@codexastudio/local-business-jsonld";

export const SITE_URL = "https://plomberie-dupont.example";

export const BUSINESS = {
  name: "Plomberie Dupont",
  legalName: "PLOMBERIE DUPONT SARL",
  description: "Dépannage et installation sanitaire au Mans depuis 1998.",
  telephone: "02 43 12 34 56",
  email: "contact@plomberie-dupont.example",
  street: "12 rue Nationale",
  city: "Le Mans",
  region: "Pays de la Loire",
  postalCode: "72000",
  openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
  areaServed: ["Le Mans", "Sarthe", "Pays de la Loire"],
} as const;

export const QUESTIONS = [
  {
    question: "Intervenez-vous en urgence ?",
    answer: "Oui, 7j/7, sous deux heures sur Le Mans et sa première couronne.",
  },
  {
    question: "Le devis est-il payant ?",
    answer: "Non, le devis est gratuit dans un rayon de 20 km autour du Mans.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Espèces, carte bancaire et chèque.",
  },
] as const;

export function buildJsonLd() {
  return graph(
    { baseUrl: SITE_URL },

    localBusiness({
      type: "Plumber",
      id: "#business",
      name: BUSINESS.name,
      legalName: BUSINESS.legalName,
      description: BUSINESS.description,
      url: "/",
      telephone: BUSINESS.telephone,
      email: BUSINESS.email,
      priceRange: "€€",
      currenciesAccepted: "EUR",
      paymentAccepted: ["Cash", "CreditCard", "CheckInAdvance"],
      image: ["/og-1x1.jpg", "/og-4x3.jpg", "/og-16x9.jpg"],
      logo: "/logo.png",
      address: {
        street: BUSINESS.street,
        city: BUSINESS.city,
        region: BUSINESS.region,
        postalCode: BUSINESS.postalCode,
      },
      geo: { lat: 48.0061, lng: 0.1996 },
      openingHours: BUSINESS.openingHours,
      specialOpeningHours: [
        { from: "2026-08-01", to: "2026-08-15", closed: true },
        { date: "2026-12-25", closed: true },
      ],
      areaServed: BUSINESS.areaServed,
      knowsLanguage: ["fr"],
      founder: "Marc Dupont",
      foundingDate: "1998",
      vatID: "FR12345678901",
    }),

    website({
      id: "#website",
      url: "/",
      name: BUSINESS.name,
      inLanguage: "fr-FR",
      publisher: "#business",
    }),

    breadcrumbs([{ name: "Accueil", url: "/" }], { id: "#fil" }),

    faq([...QUESTIONS], { id: "#faq" }),
  );
}
