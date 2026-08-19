import { describe, expect, it } from "vitest";
import { localBusiness } from "../src/builders/local-business.js";
import { InvalidPhoneError } from "../src/internal/phone.js";

/** Le cas artisan complet de §1.1, qui sert de référence au snapshot. */
const ARTISAN = {
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
    "https://plomberie-dupont.fr/og-4x3.jpg",
    "https://plomberie-dupont.fr/og-16x9.jpg",
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
  openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
  specialOpeningHours: [
    { date: "2026-12-25", closed: true },
    { from: "2026-08-01", to: "2026-08-15", closed: true },
  ],
  areaServed: ["Le Mans", "Sarthe", "Pays de la Loire"],
  sameAs: ["https://www.facebook.com/plomberiedupont", "https://g.page/plomberie-dupont"],
  aggregateRating: { value: 4.8, count: 37 },
  founder: "Marc Dupont",
  foundingDate: "1998",
  vatID: "FR12345678901",
} as const;

describe("localBusiness — socle", () => {
  it("émet @context, @type et le nom", () => {
    expect(localBusiness({ name: "Plomberie Dupont" })).toEqual({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Plomberie Dupont",
    });
  });

  it("respecte le sous-type demandé", () => {
    expect(localBusiness({ type: "Plumber", name: "X" })["@type"]).toBe("Plumber");
  });

  it("accepte un @type hors de l'union curée (échappatoire)", () => {
    expect(localBusiness({ type: "Aquarium", name: "X" })["@type"]).toBe("Aquarium");
  });

  it("place @context, @type puis @id en tête des clés", () => {
    const node = localBusiness({ type: "Plumber", id: "https://x.fr/#business", name: "X" });
    expect(Object.keys(node).slice(0, 3)).toEqual(["@context", "@type", "@id"]);
  });

  it("n'émet aucune clé pour les champs absents", () => {
    expect(Object.keys(localBusiness({ name: "X" }))).toEqual(["@context", "@type", "name"]);
  });
});

describe("localBusiness — @id et fragment (§8.5)", () => {
  it("conserve un @id qui porte déjà un fragment", () => {
    expect(localBusiness({ id: "https://x.fr/#shop", name: "X" })["@id"]).toBe(
      "https://x.fr/#shop",
    );
  });

  it("ajoute le fragment #business à un @id qui n'en a pas", () => {
    expect(localBusiness({ id: "https://x.fr/", name: "X" })["@id"]).toBe("https://x.fr/#business");
  });

  it("déduit l'@id de l'url quand aucun id n'est fourni", () => {
    expect(localBusiness({ url: "https://x.fr", name: "X" })["@id"]).toBe("https://x.fr/#business");
  });

  it("n'invente pas d'@id sans id ni url", () => {
    expect(localBusiness({ name: "X" })["@id"]).toBeUndefined();
  });

  it("résout un @id relatif contre baseUrl", () => {
    const node = localBusiness({ id: "#business", name: "X" }, { baseUrl: "https://x.fr" });
    expect(node["@id"]).toBe("https://x.fr/#business");
  });

  it("résout une url relative contre baseUrl", () => {
    const node = localBusiness({ url: "/le-mans", name: "X" }, { baseUrl: "https://x.fr" });
    expect(node.url).toBe("https://x.fr/le-mans");
  });
});

describe("localBusiness — adresse", () => {
  it("mappe les champs et applique FR par défaut", () => {
    expect(
      localBusiness({
        name: "X",
        address: { street: "12 rue Nationale", city: "Le Mans", postalCode: "72000" },
      }).address,
    ).toEqual({
      "@type": "PostalAddress",
      streetAddress: "12 rue Nationale",
      addressLocality: "Le Mans",
      postalCode: "72000",
      addressCountry: "FR",
    });
  });

  it("respecte un pays explicite", () => {
    expect(
      localBusiness({ name: "X", address: { city: "Genève", country: "CH" } }).address
        ?.addressCountry,
    ).toBe("CH");
  });

  it("respecte defaultCountry passé en option", () => {
    expect(
      localBusiness({ name: "X", address: { city: "Bruxelles" } }, { defaultCountry: "BE" }).address
        ?.addressCountry,
    ).toBe("BE");
  });

  it("concatène le complément d'adresse à la rue", () => {
    expect(
      localBusiness({ name: "X", address: { street: "12 rue Nationale", street2: "Bâtiment B" } })
        .address?.streetAddress,
    ).toBe("12 rue Nationale, Bâtiment B");
  });

  it("mappe la région et la boîte postale", () => {
    const address = localBusiness({
      name: "X",
      address: { region: "Pays de la Loire", poBox: "BP 42" },
    }).address;
    expect(address?.addressRegion).toBe("Pays de la Loire");
    expect(address?.postOfficeBoxNumber).toBe("BP 42");
  });

  it("n'émet pas d'adresse vide, même avec le pays par défaut", () => {
    expect(localBusiness({ name: "X", address: {} }).address).toBeUndefined();
  });
});

describe("localBusiness — géolocalisation", () => {
  it("mappe lat/lng en GeoCoordinates", () => {
    expect(localBusiness({ name: "X", geo: { lat: 48.0061, lng: 0.1996 } }).geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 48.0061,
      longitude: 0.1996,
    });
  });

  it("accepte l'origine (0, 0) sans l'élaguer", () => {
    expect(localBusiness({ name: "X", geo: { lat: 0, lng: 0 } }).geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: 0,
      longitude: 0,
    });
  });

  it("refuse une latitude hors bornes", () => {
    expect(() => localBusiness({ name: "X", geo: { lat: 91, lng: 0 } })).toThrow(RangeError);
  });

  it("refuse une longitude hors bornes", () => {
    expect(() => localBusiness({ name: "X", geo: { lat: 0, lng: 181 } })).toThrow(RangeError);
  });
});

describe("localBusiness — contact", () => {
  it("normalise le téléphone en E.164", () => {
    expect(localBusiness({ name: "X", telephone: "+33 2 43 12 34 56" }).telephone).toBe(
      "+33243123456",
    );
  });

  it("utilise FR comme pays par défaut pour un numéro national", () => {
    expect(localBusiness({ name: "X", telephone: "02 43 12 34 56" }).telephone).toBe(
      "+33243123456",
    );
  });

  it("suit defaultCountry pour le téléphone", () => {
    expect(
      localBusiness({ name: "X", telephone: "02 123 45 67" }, { defaultCountry: "BE" }).telephone,
    ).toBe("+3221234567");
  });

  it("laisse remonter l'erreur d'un téléphone inexploitable", () => {
    expect(() => localBusiness({ name: "X", telephone: "SOS" })).toThrow(InvalidPhoneError);
  });

  it("normalise aussi le fax", () => {
    expect(localBusiness({ name: "X", faxNumber: "02 43 12 34 57" }).faxNumber).toBe(
      "+33243123457",
    );
  });
});

describe("localBusiness — images", () => {
  it("enveloppe une image unique dans un tableau", () => {
    expect(localBusiness({ name: "X", image: "https://x.fr/a.jpg" }).image).toEqual([
      "https://x.fr/a.jpg",
    ]);
  });

  it("conserve les trois ratios recommandés dans l'ordre", () => {
    expect(
      localBusiness({ name: "X", image: ["https://x.fr/1.jpg", "https://x.fr/2.jpg"] }).image,
    ).toEqual(["https://x.fr/1.jpg", "https://x.fr/2.jpg"]);
  });

  it("transforme une image légendée en ImageObject", () => {
    expect(
      localBusiness({ name: "X", image: { url: "https://x.fr/a.jpg", caption: "Atelier" } }).image,
    ).toEqual([{ "@type": "ImageObject", url: "https://x.fr/a.jpg", caption: "Atelier" }]);
  });

  it("garde un logo simple en chaîne", () => {
    expect(localBusiness({ name: "X", logo: "https://x.fr/logo.png" }).logo).toBe(
      "https://x.fr/logo.png",
    );
  });

  it("transforme un logo légendé en ImageObject", () => {
    expect(
      localBusiness({ name: "X", logo: { url: "https://x.fr/logo.png", caption: "Logo" } }).logo,
    ).toEqual({ "@type": "ImageObject", url: "https://x.fr/logo.png", caption: "Logo" });
  });

  it("résout les images relatives contre baseUrl", () => {
    expect(
      localBusiness({ name: "X", image: "/og.jpg" }, { baseUrl: "https://x.fr" }).image,
    ).toEqual(["https://x.fr/og.jpg"]);
  });
});

describe("localBusiness — horaires", () => {
  it("branche le DSL sur openingHoursSpecification", () => {
    expect(
      localBusiness({ name: "X", openingHours: "Mo-Fr 09:00-18:00" }).openingHoursSpecification,
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ]);
  });

  it("n'émet rien pour un DSL qui ne produit aucun créneau", () => {
    expect(
      localBusiness({ name: "X", openingHours: "Su off" }).openingHoursSpecification,
    ).toBeUndefined();
  });

  it("émet les horaires exceptionnels dans specialOpeningHoursSpecification", () => {
    expect(
      localBusiness({ name: "X", specialOpeningHours: [{ date: "2026-12-25", closed: true }] })
        .specialOpeningHoursSpecification,
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        opens: "00:00",
        closes: "00:00",
        validFrom: "2026-12-25",
        validThrough: "2026-12-25",
      },
    ]);
  });
});

describe("localBusiness — listes et divers", () => {
  it("joint les moyens de paiement en une chaîne", () => {
    expect(
      localBusiness({ name: "X", paymentAccepted: ["Cash", "CreditCard"] }).paymentAccepted,
    ).toBe("Cash, CreditCard");
  });

  it("accepte un moyen de paiement unique en chaîne", () => {
    expect(localBusiness({ name: "X", paymentAccepted: "Cash" }).paymentAccepted).toBe("Cash");
  });

  it("enveloppe areaServed dans un tableau", () => {
    expect(localBusiness({ name: "X", areaServed: "Le Mans" }).areaServed).toEqual(["Le Mans"]);
  });

  it("enveloppe sameAs dans un tableau", () => {
    expect(localBusiness({ name: "X", sameAs: "https://fb.com/x" }).sameAs).toEqual([
      "https://fb.com/x",
    ]);
  });

  it("enveloppe knowsLanguage dans un tableau", () => {
    expect(localBusiness({ name: "X", knowsLanguage: "fr" }).knowsLanguage).toEqual(["fr"]);
  });

  it("mappe la note agrégée", () => {
    expect(
      localBusiness({ name: "X", aggregateRating: { value: 4.8, count: 37 } }).aggregateRating,
    ).toEqual({ "@type": "AggregateRating", ratingValue: 4.8, reviewCount: 37 });
  });

  it("émet bestRating et worstRating quand l'échelle est explicite", () => {
    expect(
      localBusiness({ name: "X", aggregateRating: { value: 8, count: 3, best: 10, worst: 0 } })
        .aggregateRating,
    ).toEqual({
      "@type": "AggregateRating",
      ratingValue: 8,
      reviewCount: 3,
      bestRating: 10,
      worstRating: 0,
    });
  });

  it("transforme un fondateur nommé en Person", () => {
    expect(localBusiness({ name: "X", founder: "Marc Dupont" }).founder).toEqual({
      "@type": "Person",
      name: "Marc Dupont",
    });
  });

  it("garde une référence de fondateur telle quelle", () => {
    expect(localBusiness({ name: "X", founder: { "@id": "#marc" } }).founder).toEqual({
      "@id": "#marc",
    });
  });

  it("transforme un avis en nœud Review", () => {
    expect(
      localBusiness({
        name: "X",
        review: [
          {
            author: "Claire M.",
            rating: 5,
            body: "Intervention rapide.",
            datePublished: "2026-05-02",
          },
        ],
      }).review,
    ).toEqual([
      {
        "@type": "Review",
        author: { "@type": "Person", name: "Claire M." },
        datePublished: "2026-05-02",
        reviewBody: "Intervention rapide.",
        reviewRating: { "@type": "Rating", ratingValue: 5 },
      },
    ]);
  });

  it("référence la maison mère", () => {
    expect(localBusiness({ name: "X", parentOrganization: "#groupe" }).parentOrganization).toEqual({
      "@id": "#groupe",
    });
  });
});

describe("localBusiness — cas artisan complet", () => {
  it("correspond au snapshot de référence", () => {
    expect(localBusiness(ARTISAN)).toMatchSnapshot();
  });

  it("produit trois créneaux d'horaires réguliers", () => {
    expect(localBusiness(ARTISAN).openingHoursSpecification).toHaveLength(3);
  });

  it("produit deux périodes exceptionnelles", () => {
    expect(localBusiness(ARTISAN).specialOpeningHoursSpecification).toHaveLength(2);
  });

  it("ne contient aucune valeur null ou undefined après sérialisation", () => {
    const json = JSON.stringify(localBusiness(ARTISAN));
    expect(json).not.toContain("null");
    expect(json).not.toContain("undefined");
  });
});
