import { describe, expect, it } from "vitest";
import { prune } from "../src/internal/prune.js";

describe("prune — élagage", () => {
  it("retire les propriétés undefined", () => {
    expect(prune({ a: 1, b: undefined })).toEqual({ a: 1 });
  });

  it("retire les propriétés null (jamais de null en sortie)", () => {
    expect(prune({ a: 1, b: null })).toEqual({ a: 1 });
  });

  it("retire les chaînes vides", () => {
    expect(prune({ name: "", url: "https://x.fr" })).toEqual({ url: "https://x.fr" });
  });

  it("retire les chaînes qui ne contiennent que des espaces", () => {
    expect(prune({ name: "   \n\t " })).toEqual({});
  });

  it("supprime les espaces de début et de fin des chaînes conservées", () => {
    expect(prune({ name: "  Plomberie Dupont  " })).toEqual({ name: "Plomberie Dupont" });
  });

  it("retire les tableaux vides", () => {
    expect(prune({ image: [], name: "X" })).toEqual({ name: "X" });
  });

  it("retire les entrées undefined et null des tableaux", () => {
    expect(prune({ image: ["a", undefined, null, "b"] })).toEqual({ image: ["a", "b"] });
  });

  it("retire un tableau dont toutes les entrées sont élaguées", () => {
    expect(prune({ image: [undefined, null, ""] })).toEqual({});
  });

  it("préserve l'ordre des tableaux", () => {
    expect(prune({ days: ["Monday", "Friday", "Tuesday"] })).toEqual({
      days: ["Monday", "Friday", "Tuesday"],
    });
  });

  it("élague récursivement les objets imbriqués", () => {
    expect(
      prune({
        address: {
          "@type": "PostalAddress",
          streetAddress: "12 rue Nationale",
          postalCode: undefined,
        },
      }),
    ).toEqual({
      address: { "@type": "PostalAddress", streetAddress: "12 rue Nationale" },
    });
  });

  it("retire un objet imbriqué devenu vide", () => {
    expect(prune({ name: "X", geo: { latitude: undefined, longitude: undefined } })).toEqual({
      name: "X",
    });
  });

  it("retire un objet imbriqué qui ne garde que son @type", () => {
    expect(prune({ name: "X", address: { "@type": "PostalAddress", city: undefined } })).toEqual({
      name: "X",
    });
  });

  it("conserve un objet qui ne garde que @type et @id (c'est une référence)", () => {
    expect(prune({ publisher: { "@type": "Organization", "@id": "#business" } })).toEqual({
      publisher: { "@type": "Organization", "@id": "#business" },
    });
  });

  it("élague les objets à l'intérieur des tableaux", () => {
    expect(
      prune({
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            opens: "09:00",
            closes: "18:00",
            validFrom: undefined,
          },
          { "@type": "OpeningHoursSpecification", opens: undefined, closes: undefined },
        ],
      }),
    ).toEqual({
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", opens: "09:00", closes: "18:00" },
      ],
    });
  });
});

describe("prune — valeurs conservées", () => {
  it("conserve false", () => {
    expect(prune({ closed: false })).toEqual({ closed: false });
  });

  it("conserve 0", () => {
    expect(prune({ latitude: 0, longitude: 0 })).toEqual({ latitude: 0, longitude: 0 });
  });

  it("retire les nombres non finis (ils sérialiseraient en null)", () => {
    expect(prune({ a: Number.NaN, b: Number.POSITIVE_INFINITY, c: 1 })).toEqual({ c: 1 });
  });
});

describe("prune — ordre des clés", () => {
  it("place @context, @type puis @id en tête", () => {
    const out = prune({
      name: "X",
      "@id": "#b",
      "@type": "Plumber",
      "@context": "https://schema.org",
    });
    expect(Object.keys(out)).toEqual(["@context", "@type", "@id", "name"]);
  });

  it("place @graph juste après @context", () => {
    const out = prune({
      "@graph": [{ "@type": "Thing", name: "x" }],
      "@context": "https://schema.org",
    });
    expect(Object.keys(out)).toEqual(["@context", "@graph"]);
  });

  it("trie les autres clés par ordre de code-unit (déterministe, sans locale)", () => {
    const out = prune({ url: "u", address: { "@type": "PostalAddress", city: "c" }, name: "n" });
    expect(Object.keys(out)).toEqual(["address", "name", "url"]);
  });

  it("trie aussi les clés des objets imbriqués", () => {
    const out = prune({
      address: { postalCode: "72000", "@type": "PostalAddress", addressLocality: "Le Mans" },
    });
    expect(Object.keys(out.address as object)).toEqual(["@type", "addressLocality", "postalCode"]);
  });
});

describe("prune — pureté", () => {
  it("ne modifie pas l'objet d'entrée", () => {
    const input = { name: "  X  ", b: undefined, nested: { a: 1, b: null } };
    const snapshot = JSON.stringify(input);
    prune(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it("retourne un objet vide pour un objet entièrement élagué", () => {
    expect(prune({ a: undefined, b: null, c: "" })).toEqual({});
  });
});
