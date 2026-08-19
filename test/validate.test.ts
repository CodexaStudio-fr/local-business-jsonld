import { describe, expect, it } from "vitest";
import { faq } from "../src/builders/faq.js";
import { graph } from "../src/builders/graph.js";
import { localBusiness } from "../src/builders/local-business.js";
import { website } from "../src/builders/website.js";
import { validate } from "../src/validate/index.js";

/** Un nœud qui coche tout ce que Google demande et recommande. */
const COMPLETE = {
  type: "Plumber",
  id: "https://plomberie-dupont.fr/#business",
  name: "Plomberie Dupont",
  url: "https://plomberie-dupont.fr",
  telephone: "+33243123456",
  priceRange: "€€",
  image: ["https://plomberie-dupont.fr/og-1x1.jpg"],
  address: {
    street: "12 rue Nationale",
    city: "Le Mans",
    postalCode: "72000",
    country: "FR",
  },
  geo: { lat: 48.0061, lng: 0.1996 },
  openingHours: "Mo-Fr 09:00-18:00",
} as const;

const codes = (issues: { code: string }[]) => issues.map((issue) => issue.code);

describe("validate — nœud complet", () => {
  it("ne signale ni erreur ni avertissement", () => {
    const result = validate(localBusiness(COMPLETE));
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe("validate — propriétés obligatoires de Google", () => {
  it("exige le nom", () => {
    const { errors, valid } = validate(localBusiness({ ...COMPLETE, name: undefined }));
    expect(codes(errors)).toContain("missing-name");
    expect(valid).toBe(false);
  });

  it("exige l'adresse", () => {
    const { errors, valid } = validate(localBusiness({ ...COMPLETE, address: undefined }));
    expect(codes(errors)).toContain("missing-address");
    expect(valid).toBe(false);
  });

  it("exige le @context à la racine", () => {
    const { errors } = validate({ "@type": "Plumber", name: "X" });
    expect(codes(errors)).toContain("missing-context");
  });

  it("pointe la propriété fautive", () => {
    const { errors } = validate(localBusiness({ ...COMPLETE, name: undefined }));
    expect(errors.find((issue) => issue.code === "missing-name")?.property).toBe("name");
  });
});

describe("validate — propriétés recommandées", () => {
  it("signale l'absence d'image", () => {
    expect(codes(validate(localBusiness({ ...COMPLETE, image: undefined })).warnings)).toContain(
      "missing-image",
    );
  });

  it("signale l'absence de téléphone", () => {
    expect(
      codes(validate(localBusiness({ ...COMPLETE, telephone: undefined })).warnings),
    ).toContain("missing-telephone");
  });

  it("signale l'absence d'url", () => {
    expect(codes(validate(localBusiness({ ...COMPLETE, url: undefined })).warnings)).toContain(
      "missing-url",
    );
  });

  it("signale l'absence de coordonnées", () => {
    expect(codes(validate(localBusiness({ ...COMPLETE, geo: undefined })).warnings)).toContain(
      "missing-geo",
    );
  });

  it("signale l'absence d'horaires", () => {
    expect(
      codes(validate(localBusiness({ ...COMPLETE, openingHours: undefined })).warnings),
    ).toContain("missing-opening-hours");
  });

  it("signale l'absence de fourchette de prix", () => {
    expect(
      codes(validate(localBusiness({ ...COMPLETE, priceRange: undefined })).warnings),
    ).toContain("missing-price-range");
  });

  it("ne bloque pas les rich results pour un manque recommandé", () => {
    expect(validate(localBusiness({ ...COMPLETE, image: undefined })).valid).toBe(true);
  });
});

describe("validate — adresse incomplète", () => {
  it("signale une commune manquante", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, address: { street: "12 rue Nationale", postalCode: "72000" } }),
    );
    expect(codes(result.warnings)).toContain("incomplete-address");
    expect(result.warnings.some((issue) => issue.property === "address.addressLocality")).toBe(
      true,
    );
  });

  it("signale un code postal manquant", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, address: { street: "12 rue Nationale", city: "Le Mans" } }),
    );
    expect(result.warnings.some((issue) => issue.property === "address.postalCode")).toBe(true);
  });

  it("signale une voie manquante", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, address: { city: "Le Mans", postalCode: "72000" } }),
    );
    expect(result.warnings.some((issue) => issue.property === "address.streetAddress")).toBe(true);
  });
});

describe("validate — aggregateRating (§8.3)", () => {
  it("avertit systématiquement sur les avis auto-déclarés", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 4.8, count: 37 } }),
    );
    expect(codes(result.warnings)).toContain("self-declared-rating");
  });

  it("explique la règle Google dans le message", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 4.8, count: 37 } }),
    );
    const warning = result.warnings.find((issue) => issue.code === "self-declared-rating");
    expect(warning?.message).toMatch(/rich results/i);
  });

  it("refuse une note au-dessus de l'échelle", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 6, count: 3 } }),
    );
    expect(codes(result.errors)).toContain("rating-out-of-range");
    expect(result.valid).toBe(false);
  });

  it("refuse une note en dessous de l'échelle", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 0.5, count: 3 } }),
    );
    expect(codes(result.errors)).toContain("rating-out-of-range");
  });

  it("respecte une échelle explicite", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 8, count: 3, best: 10, worst: 0 } }),
    );
    expect(codes(result.errors)).not.toContain("rating-out-of-range");
  });

  it("refuse un nombre d'avis nul", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, aggregateRating: { value: 4.8, count: 0 } }),
    );
    expect(codes(result.errors)).toContain("rating-count-invalid");
  });

  it("avertit aussi sur les avis individuels", () => {
    const result = validate(
      localBusiness({ ...COMPLETE, review: [{ author: "Claire M.", rating: 5 }] }),
    );
    expect(codes(result.warnings)).toContain("self-declared-rating");
  });
});

describe("validate — @id et liaison du graphe (§8.5)", () => {
  it("signale un @id sans fragment", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Plumber",
      "@id": "https://x.fr/",
      name: "X",
      address: { "@type": "PostalAddress", addressLocality: "Le Mans" },
    });
    expect(codes(result.warnings)).toContain("id-without-fragment");
  });

  it("signale un nœud sans @id", () => {
    expect(
      codes(validate(localBusiness({ ...COMPLETE, id: undefined, url: undefined })).warnings),
    ).toContain("missing-id");
  });

  it("signale une référence qui ne pointe sur aucun nœud du graphe", () => {
    const document = graph(
      localBusiness({ ...COMPLETE, id: "#business" }),
      website({ id: "#website", publisher: "#introuvable" }),
    );
    const result = validate(document);
    const dangling = result.warnings.find((issue) => issue.code === "dangling-reference");
    expect(dangling).toBeDefined();
    expect(dangling?.message).toContain("#introuvable");
  });

  it("ne signale rien quand la référence est résolue", () => {
    const document = graph(
      localBusiness({ ...COMPLETE, id: "#business" }),
      website({ id: "#website", publisher: "#business" }),
    );
    expect(codes(validate(document).warnings)).not.toContain("dangling-reference");
  });
});

describe("validate — téléphone et horaires", () => {
  it("signale un téléphone qui n'est pas en E.164", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Plumber",
      "@id": "https://x.fr/#business",
      name: "X",
      telephone: "02 43 12 34 56",
      address: { "@type": "PostalAddress", addressLocality: "Le Mans" },
    });
    expect(codes(result.warnings)).toContain("telephone-not-e164");
  });

  it("signale une fermeture à 24:00 au lieu de 23:59 (§8.4)", () => {
    const result = validate({
      "@context": "https://schema.org",
      "@type": "Plumber",
      "@id": "https://x.fr/#business",
      name: "X",
      address: { "@type": "PostalAddress", addressLocality: "Le Mans" },
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", opens: "09:00", closes: "24:00" },
      ],
    });
    expect(codes(result.warnings)).toContain("closes-at-24");
  });
});

describe("validate — graphe", () => {
  it("valide chaque établissement du graphe", () => {
    const document = graph(
      localBusiness({ ...COMPLETE, id: "#a" }),
      localBusiness({ id: "#b", name: "Sans adresse" }),
    );
    const result = validate(document);
    expect(codes(result.errors)).toContain("missing-address");
    expect(result.valid).toBe(false);
  });

  it("attribue chaque problème à son nœud", () => {
    const document = graph(
      localBusiness({ ...COMPLETE, id: "#a" }),
      localBusiness({ id: "#b", name: "Sans adresse" }),
    );
    const issue = validate(document).errors.find((entry) => entry.code === "missing-address");
    expect(issue?.nodeId).toBe("#b");
  });

  it("n'applique pas les règles LocalBusiness aux autres nœuds", () => {
    const document = graph(
      localBusiness({ ...COMPLETE, id: "#business" }),
      website({ id: "#website", url: "https://x.fr" }),
      faq([{ question: "Q", answer: "R" }], { id: "#faq" }),
    );
    const result = validate(document);
    expect(result.errors).toEqual([]);
    expect(codes(result.warnings)).not.toContain("missing-address");
  });

  it("n'exige pas de @context sur les enfants", () => {
    const document = graph(localBusiness({ ...COMPLETE, id: "#business" }));
    expect(codes(validate(document).errors)).not.toContain("missing-context");
  });

  it("valide un @type hors union curée quand on l'annonce", () => {
    const document = graph(localBusiness({ type: "VeterinaryCare", id: "#vet", name: "Clinique" }));
    const result = validate(document, { businessTypes: ["VeterinaryCare"] });
    expect(codes(result.errors)).toContain("missing-address");
  });

  it("ignore un @type inconnu qu'on ne lui annonce pas", () => {
    const document = graph(localBusiness({ type: "VeterinaryCare", id: "#vet", name: "Clinique" }));
    expect(codes(validate(document).errors)).not.toContain("missing-address");
  });
});

describe("validate — messages", () => {
  it("écrit en français", () => {
    const { errors } = validate(localBusiness({ ...COMPLETE, name: undefined }));
    expect(errors[0]?.message).toContain("obligatoire");
  });

  it("conserve les accents, donc l'encodage du catalogue est sain", () => {
    const { warnings } = validate(localBusiness({ ...COMPLETE, geo: undefined }));
    expect(warnings.find((issue) => issue.code === "missing-geo")?.message).toContain(
      "coordonnées",
    );
  });

  it("nomme la propriété dans le message", () => {
    const { warnings } = validate(localBusiness({ ...COMPLETE, priceRange: undefined }));
    const warning = warnings.find((issue) => issue.code === "missing-price-range");
    expect(warning?.message).toContain("priceRange");
  });

  it("accepte explicitement la locale fr", () => {
    const result = validate(localBusiness(COMPLETE), { locale: "fr" });
    expect(result.valid).toBe(true);
  });
});
