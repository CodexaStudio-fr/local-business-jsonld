import { describe, expect, it } from "vitest";
import { localBusiness } from "../src/builders/local-business.js";
import { serialize } from "../src/serialize.js";

/** La charge du plan §7, celle qui casse une page et ouvre une XSS. */
const PAYLOAD = "</script><script>alert(1)</script>";

describe("serialize — échappement (§8.1)", () => {
  it("n'émet jamais la séquence de fermeture de script", () => {
    const html = serialize(localBusiness({ name: PAYLOAD }));
    expect(html).not.toContain("</script");
    expect(html).not.toContain("<script");
  });

  it("échappe le chevron ouvrant en \\u003c", () => {
    expect(serialize({ name: "a<b" })).toContain("a\\u003cb");
  });

  it("échappe le chevron fermant en \\u003e", () => {
    expect(serialize({ name: "a>b" })).toContain("a\\u003eb");
  });

  it("échappe l'esperluette en \\u0026", () => {
    expect(serialize({ name: "Dupont & Fils" })).toContain("Dupont \\u0026 Fils");
  });

  it("échappe les séparateurs de ligne U+2028 et U+2029", () => {
    const html = serialize({ name: "a\u2028b\u2029c" });
    expect(html).toContain("\\u2028");
    expect(html).toContain("\\u2029");
    expect(html).not.toContain("\u2028");
    expect(html).not.toContain("\u2029");
  });

  it("reste du JSON valide qui restitue la charge à l'identique", () => {
    const parsed = JSON.parse(serialize({ name: PAYLOAD })) as { name: string };
    expect(parsed.name).toBe(PAYLOAD);
  });

  it("restitue l'esperluette et les chevrons à l'identique", () => {
    const parsed = JSON.parse(serialize({ name: "Dupont & Fils <72>" })) as { name: string };
    expect(parsed.name).toBe("Dupont & Fils <72>");
  });

  it("laisse les accents intacts : ce n'est pas de l'échappement HTML", () => {
    expect(serialize({ name: "Dépannage à Château-du-Loir" })).toContain(
      "Dépannage à Château-du-Loir",
    );
  });

  it("échappe aussi dans les valeurs imbriquées", () => {
    const html = serialize({ address: { "@type": "PostalAddress", streetAddress: "12 <rue>" } });
    expect(html).toContain("12 \\u003crue\\u003e");
  });
});

describe("serialize — déterminisme (§8.9)", () => {
  it("ordonne les clés, quel que soit l'ordre d'écriture", () => {
    const a = serialize({ url: "u", "@type": "Plumber", name: "n" });
    const b = serialize({ name: "n", url: "u", "@type": "Plumber" });
    expect(a).toBe(b);
    expect(a).toBe('{"@type":"Plumber","name":"n","url":"u"}');
  });

  it("élague les valeurs absentes", () => {
    expect(serialize({ name: "X", telephone: undefined, email: null })).toBe('{"name":"X"}');
  });
});

describe("serialize — mise en forme", () => {
  it("produit du JSON compact par défaut", () => {
    expect(serialize({ name: "X", url: "u" })).toBe('{"name":"X","url":"u"}');
  });

  it("indente sur demande", () => {
    expect(serialize({ name: "X" }, { space: 2 })).toBe('{\n  "name": "X"\n}');
  });
});
