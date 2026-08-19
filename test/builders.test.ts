import { describe, expect, it } from "vitest";
import { breadcrumbs } from "../src/builders/breadcrumbs.js";
import { faq } from "../src/builders/faq.js";
import { organization } from "../src/builders/organization.js";
import { review } from "../src/builders/review.js";
import { service } from "../src/builders/service.js";
import { website } from "../src/builders/website.js";

describe("website", () => {
  it("émet un nœud WebSite avec son @context", () => {
    expect(website({ url: "https://x.fr", name: "Plomberie Dupont" })).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://x.fr/#website",
      url: "https://x.fr",
      name: "Plomberie Dupont",
    });
  });

  it("ajoute le fragment #website à un @id qui n'en a pas", () => {
    expect(website({ id: "https://x.fr/" })["@id"]).toBe("https://x.fr/#website");
  });

  it("référence l'éditeur", () => {
    expect(website({ url: "https://x.fr", publisher: "#business" }).publisher).toEqual({
      "@id": "#business",
    });
  });

  it("transporte inLanguage et la description", () => {
    const node = website({ url: "https://x.fr", inLanguage: "fr-FR", description: "Site" });
    expect(node.inLanguage).toBe("fr-FR");
    expect(node.description).toBe("Site");
  });

  it("construit la searchbox depuis un gabarit d'URL", () => {
    expect(
      website({
        url: "https://x.fr",
        searchAction: "https://x.fr/recherche?q={search_term_string}",
      }).potentialAction,
    ).toEqual([
      {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://x.fr/recherche?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    ]);
  });

  it("accepte un nom de variable personnalisé", () => {
    const node = website({
      url: "https://x.fr",
      searchAction: { urlTemplate: "https://x.fr/s?terme={terme}", queryName: "terme" },
    });
    expect(node.potentialAction?.[0]?.["query-input"]).toBe("required name=terme");
  });

  it("refuse un gabarit qui ne contient pas la variable", () => {
    expect(() => website({ url: "https://x.fr", searchAction: "https://x.fr/recherche" })).toThrow(
      TypeError,
    );
  });

  it("résout un gabarit relatif contre baseUrl", () => {
    const node = website(
      { url: "/", searchAction: "/recherche?q={search_term_string}" },
      { baseUrl: "https://x.fr" },
    );
    expect(node.potentialAction?.[0]?.target.urlTemplate).toBe(
      "https://x.fr/recherche?q={search_term_string}",
    );
  });
});

describe("organization", () => {
  it("émet un nœud Organization", () => {
    expect(organization({ id: "#groupe", name: "Groupe Dupont" })).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "#groupe",
      name: "Groupe Dupont",
    });
  });

  it("respecte un sous-type", () => {
    expect(organization({ type: "Corporation", name: "X" })["@type"]).toBe("Corporation");
  });

  it("ajoute le fragment #organization à un @id qui n'en a pas", () => {
    expect(organization({ id: "https://x.fr/", name: "X" })["@id"]).toBe(
      "https://x.fr/#organization",
    );
  });

  it("mappe adresse, logo et sameAs", () => {
    const node = organization({
      name: "X",
      address: { city: "Le Mans", postalCode: "72000" },
      logo: "https://x.fr/logo.png",
      sameAs: "https://fb.com/x",
    });
    expect(node.address?.addressLocality).toBe("Le Mans");
    expect(node.address?.addressCountry).toBe("FR");
    expect(node.logo).toBe("https://x.fr/logo.png");
    expect(node.sameAs).toEqual(["https://fb.com/x"]);
  });

  it("normalise le téléphone", () => {
    expect(organization({ name: "X", telephone: "02 43 12 34 56" }).telephone).toBe("+33243123456");
  });

  it("référence la maison mère", () => {
    expect(organization({ name: "X", parentOrganization: "#groupe" }).parentOrganization).toEqual({
      "@id": "#groupe",
    });
  });
});

describe("breadcrumbs", () => {
  it("numérote les étapes à partir de 1", () => {
    expect(
      breadcrumbs([
        { name: "Accueil", url: "https://x.fr" },
        { name: "Services", url: "https://x.fr/services" },
        { name: "Dépannage" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://x.fr" },
        { "@type": "ListItem", position: 2, name: "Services", item: "https://x.fr/services" },
        { "@type": "ListItem", position: 3, name: "Dépannage" },
      ],
    });
  });

  it("résout les URLs relatives contre baseUrl", () => {
    const node = breadcrumbs([{ name: "Accueil", url: "/" }], { baseUrl: "https://x.fr" });
    expect(node.itemListElement[0]?.item).toBe("https://x.fr/");
  });

  it("accepte un @id explicite", () => {
    expect(breadcrumbs([{ name: "Accueil" }], { id: "#fil" })["@id"]).toBe("#fil");
  });

  it("refuse un fil d'Ariane vide", () => {
    expect(() => breadcrumbs([])).toThrow(TypeError);
  });
});

describe("faq", () => {
  it("émet une FAQPage", () => {
    expect(
      faq([
        { question: "Intervenez-vous en urgence ?", answer: "Oui, 7j/7." },
        { question: "Quels moyens de paiement ?", answer: "Espèces, carte, chèque." },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Intervenez-vous en urgence ?",
          acceptedAnswer: { "@type": "Answer", text: "Oui, 7j/7." },
        },
        {
          "@type": "Question",
          name: "Quels moyens de paiement ?",
          acceptedAnswer: { "@type": "Answer", text: "Espèces, carte, chèque." },
        },
      ],
    });
  });

  it("accepte un @id explicite", () => {
    expect(faq([{ question: "Q", answer: "R" }], { id: "#faq" })["@id"]).toBe("#faq");
  });

  it("refuse une FAQ vide", () => {
    expect(() => faq([])).toThrow(TypeError);
  });
});

describe("service", () => {
  it("émet un nœud Service", () => {
    expect(
      service({ id: "#depannage", name: "Dépannage plomberie", provider: "#business" }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": "#depannage",
      name: "Dépannage plomberie",
      provider: { "@id": "#business" },
    });
  });

  it("respecte un sous-type", () => {
    expect(service({ type: "PlumbingService", name: "X" })["@type"]).toBe("PlumbingService");
  });

  it("ajoute le fragment #service à un @id qui n'en a pas", () => {
    expect(service({ id: "https://x.fr/depannage", name: "X" })["@id"]).toBe(
      "https://x.fr/depannage#service",
    );
  });

  it("enveloppe areaServed dans un tableau", () => {
    expect(service({ name: "X", areaServed: "Le Mans" }).areaServed).toEqual(["Le Mans"]);
  });

  it("convertit un prix numérique en chaîne et applique EUR par défaut", () => {
    expect(service({ name: "X", offers: [{ name: "Devis", price: 90 }] }).offers).toEqual([
      { "@type": "Offer", name: "Devis", price: "90", priceCurrency: "EUR" },
    ]);
  });

  it("respecte une devise explicite", () => {
    expect(
      service({ name: "X", offers: [{ price: "90.00", priceCurrency: "CHF" }] }).offers?.[0]
        ?.priceCurrency,
    ).toBe("CHF");
  });

  it("n'ajoute pas de devise sans prix", () => {
    expect(service({ name: "X", offers: [{ name: "Diagnostic" }] }).offers).toEqual([
      { "@type": "Offer", name: "Diagnostic" },
    ]);
  });

  it("développe une disponibilité courte en URL schema.org", () => {
    expect(
      service({ name: "X", offers: [{ availability: "InStock" }] }).offers?.[0]?.availability,
    ).toBe("https://schema.org/InStock");
  });

  it("laisse une disponibilité déjà en URL intacte", () => {
    expect(
      service({ name: "X", offers: [{ availability: "https://schema.org/OutOfStock" }] })
        .offers?.[0]?.availability,
    ).toBe("https://schema.org/OutOfStock");
  });
});

describe("review", () => {
  it("émet un nœud Review avec son @context", () => {
    expect(
      review({
        author: "Claire M.",
        rating: 5,
        body: "Intervention rapide.",
        datePublished: "2026-05-02",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Review",
      author: { "@type": "Person", name: "Claire M." },
      datePublished: "2026-05-02",
      reviewBody: "Intervention rapide.",
      reviewRating: { "@type": "Rating", ratingValue: 5 },
    });
  });

  it("porte l'échelle quand elle est explicite", () => {
    expect(review({ author: "A", rating: 8, best: 10, worst: 0 }).reviewRating).toEqual({
      "@type": "Rating",
      ratingValue: 8,
      bestRating: 10,
      worstRating: 0,
    });
  });

  it("référence l'élément noté", () => {
    expect(review({ author: "A", rating: 5, itemReviewed: "#business" }).itemReviewed).toEqual({
      "@id": "#business",
    });
  });
});
