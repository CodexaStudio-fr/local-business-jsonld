import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { graph } from "../src/builders/graph.js";
import { localBusiness } from "../src/builders/local-business.js";
import { website } from "../src/builders/website.js";
import { JsonLd } from "../src/next/index.js";
import { serialize } from "../src/serialize.js";

const PAYLOAD = "</script><script>alert(1)</script>";

describe("JsonLd — rendu", () => {
  it("émet un script application/ld+json", () => {
    const html = renderToStaticMarkup(<JsonLd data={localBusiness({ name: "X" })} />);
    expect(html).toBe(
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"X"}</script>',
    );
  });

  it("sérialise un @graph complet", () => {
    const document = graph(
      localBusiness({ id: "#business", name: "X" }),
      website({ id: "#website", url: "https://x.fr" }),
    );
    expect(renderToStaticMarkup(<JsonLd data={document} />)).toContain(serialize(document));
  });

  it("accepte un id de script", () => {
    expect(renderToStaticMarkup(<JsonLd data={{ name: "X" }} id="ld-business" />)).toContain(
      'id="ld-business"',
    );
  });

  it("accepte un nonce CSP", () => {
    expect(renderToStaticMarkup(<JsonLd data={{ name: "X" }} nonce="abc123" />)).toContain(
      'nonce="abc123"',
    );
  });

  it("indente sur demande", () => {
    expect(renderToStaticMarkup(<JsonLd data={{ name: "X" }} space={2} />)).toContain(
      '{\n  "name"',
    );
  });
});

describe("JsonLd — inertie du contenu injecté (§8.1)", () => {
  it("ne referme jamais la balise script depuis les données", () => {
    const html = renderToStaticMarkup(<JsonLd data={localBusiness({ name: PAYLOAD })} />);
    // Une seule ouverture, une seule fermeture : la charge n'a pas cassé la balise.
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });

  it("laisse la charge lisible pour un parseur JSON-LD", () => {
    const html = renderToStaticMarkup(<JsonLd data={localBusiness({ name: PAYLOAD })} />);
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    const parsed = JSON.parse(json) as { name: string };
    expect(parsed.name).toBe(PAYLOAD);
  });
});

describe("JsonLd — server component (§8.10)", () => {
  const source = readFileSync(new URL("../src/next/index.tsx", import.meta.url), "utf8");

  it("ne porte pas la directive client", () => {
    // La directive est une instruction-chaîne seule sur sa ligne ; une mention
    // en commentaire n'en est pas une.
    expect(source).not.toMatch(/^\s*["']use client["'];?\s*$/m);
  });

  it("n'utilise aucun hook React", () => {
    expect(source).not.toMatch(/\buse[A-Z]\w*\(/);
  });

  it("n'importe rien d'autre que les types de React", () => {
    expect(source).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+"react"/m);
  });
});
