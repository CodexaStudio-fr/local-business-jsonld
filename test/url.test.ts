import { describe, expect, it } from "vitest";
import {
  canonicalizeUrl,
  InvalidUrlError,
  isAbsoluteUrl,
  resolveUrl,
  toIdRef,
  withFragment,
} from "../src/internal/url.js";

describe("isAbsoluteUrl", () => {
  it("reconnaît une URL http", () => {
    expect(isAbsoluteUrl("https://x.fr")).toBe(true);
  });

  it("reconnaît un mailto", () => {
    expect(isAbsoluteUrl("mailto:contact@x.fr")).toBe(true);
  });

  it("rejette un fragment", () => {
    expect(isAbsoluteUrl("#business")).toBe(false);
  });

  it("rejette un chemin racine", () => {
    expect(isAbsoluteUrl("/contact")).toBe(false);
  });
});

describe("resolveUrl", () => {
  it("résout un fragment contre une base sans chemin", () => {
    expect(resolveUrl("#business", "https://x.fr")).toBe("https://x.fr/#business");
  });

  it("résout un fragment contre une base avec barre finale", () => {
    expect(resolveUrl("#business", "https://x.fr/")).toBe("https://x.fr/#business");
  });

  it("résout un fragment contre une base avec chemin", () => {
    expect(resolveUrl("#business", "https://x.fr/le-mans")).toBe("https://x.fr/le-mans#business");
  });

  it("résout un chemin racine", () => {
    expect(resolveUrl("/contact", "https://x.fr")).toBe("https://x.fr/contact");
  });

  it("laisse une URL absolue intacte, sans la normaliser", () => {
    expect(resolveUrl("https://plomberie-dupont.fr", "https://x.fr")).toBe(
      "https://plomberie-dupont.fr",
    );
  });

  it("laisse un mailto intact", () => {
    expect(resolveUrl("mailto:contact@x.fr", "https://x.fr")).toBe("mailto:contact@x.fr");
  });

  it("laisse une valeur relative intacte sans base", () => {
    expect(resolveUrl("#business", undefined)).toBe("#business");
  });

  it("refuse une base qui n'est pas une URL", () => {
    expect(() => resolveUrl("#business", "pas-une-url")).toThrow(InvalidUrlError);
  });
});

describe("withFragment", () => {
  it("ajoute le fragment par défaut à une URL qui n'en a pas (§8.5)", () => {
    expect(withFragment("https://x.fr/", "business")).toBe("https://x.fr/#business");
  });

  it("ajoute le fragment à une URL sans barre finale", () => {
    expect(withFragment("https://x.fr", "business")).toBe("https://x.fr#business");
  });

  it("respecte un fragment déjà présent", () => {
    expect(withFragment("https://x.fr/#shop", "business")).toBe("https://x.fr/#shop");
  });

  it("laisse un fragment nu intact", () => {
    expect(withFragment("#business", "business")).toBe("#business");
  });
});

describe("toIdRef", () => {
  it("transforme une chaîne en référence de nœud", () => {
    expect(toIdRef("#business", "https://x.fr")).toEqual({ "@id": "https://x.fr/#business" });
  });

  it("résout aussi une référence déjà objet", () => {
    expect(toIdRef({ "@id": "#business" }, "https://x.fr")).toEqual({
      "@id": "https://x.fr/#business",
    });
  });

  it("laisse une référence absolue intacte", () => {
    expect(toIdRef("https://y.fr/#business", "https://x.fr")).toEqual({
      "@id": "https://y.fr/#business",
    });
  });

  it("fonctionne sans base", () => {
    expect(toIdRef("#business", undefined)).toEqual({ "@id": "#business" });
  });
});

describe("canonicalizeUrl", () => {
  it("ajoute la barre de racine manquante", () => {
    expect(canonicalizeUrl("https://x.fr")).toBe("https://x.fr/");
  });

  it("laisse un chemin existant intact", () => {
    expect(canonicalizeUrl("https://x.fr/le-mans")).toBe("https://x.fr/le-mans");
  });

  it("laisse une valeur relative intacte", () => {
    expect(canonicalizeUrl("#business")).toBe("#business");
  });

  it("laisse une valeur non parsable intacte plutôt que de lever", () => {
    expect(canonicalizeUrl("https://")).toBe("https://");
  });
});
