import { afterEach, describe, expect, it, vi } from "vitest";
import { breadcrumbs } from "../src/builders/breadcrumbs.js";
import { faq } from "../src/builders/faq.js";
import { graph } from "../src/builders/graph.js";
import { localBusiness } from "../src/builders/local-business.js";
import { website } from "../src/builders/website.js";

afterEach(() => {
  vi.restoreAllMocks();
});

const business = () =>
  localBusiness({
    type: "Plumber",
    id: "#business",
    name: "Plomberie Dupont",
    address: { street: "12 rue Nationale", city: "Le Mans", postalCode: "72000" },
  });

describe("graph — @context", () => {
  it("hisse un seul @context à la racine", () => {
    const document = graph(business(), website({ id: "#website", url: "https://x.fr" }));
    expect(document["@context"]).toBe("https://schema.org");
    expect(Object.keys(document)).toEqual(["@context", "@graph"]);
  });

  it("retire le @context de chaque enfant (§8.2)", () => {
    const document = graph(business(), website({ id: "#website", url: "https://x.fr" }));
    for (const node of document["@graph"]) {
      expect(node).not.toHaveProperty("@context");
    }
  });

  it("n'apparaît qu'une fois dans le JSON sérialisé", () => {
    const json = JSON.stringify(
      graph(business(), website({ id: "#website" }), faq([{ question: "Q", answer: "R" }])),
    );
    expect(json.match(/@context/g)).toHaveLength(1);
  });
});

describe("graph — ordre et contenu", () => {
  it("conserve l'ordre des nœuds", () => {
    const document = graph(
      business(),
      website({ id: "#website" }),
      breadcrumbs([{ name: "Accueil", url: "https://x.fr" }], { id: "#fil" }),
      faq([{ question: "Q", answer: "R" }], { id: "#faq" }),
    );
    expect(document["@graph"].map((node) => node["@type"])).toEqual([
      "Plumber",
      "WebSite",
      "BreadcrumbList",
      "FAQPage",
    ]);
  });

  it("compose un graphe de quatre nœuds liés", () => {
    const document = graph(
      { baseUrl: "https://plomberie-dupont.fr" },
      business(),
      website({ id: "#website", url: "/", publisher: "#business" }),
      breadcrumbs([{ name: "Accueil", url: "/" }], { id: "#fil" }),
      faq([{ question: "Q", answer: "R" }], { id: "#faq" }),
    );
    expect(document).toMatchSnapshot();
  });

  it("ignore les nœuds absents, pour composer conditionnellement", () => {
    const maybe = undefined;
    const document = graph(business(), maybe, website({ id: "#website" }));
    expect(document["@graph"]).toHaveLength(2);
  });

  it("aplatit un graphe imbriqué", () => {
    const inner = graph(website({ id: "#website" }), faq([{ question: "Q", answer: "R" }]));
    const document = graph(business(), inner);
    expect(document["@graph"].map((node) => node["@type"])).toEqual([
      "Plumber",
      "WebSite",
      "FAQPage",
    ]);
  });

  it("refuse un graphe sans aucun nœud", () => {
    expect(() => graph()).toThrow(TypeError);
  });

  it("refuse un graphe dont tous les nœuds sont absents", () => {
    expect(() => graph(undefined, null)).toThrow(TypeError);
  });
});

describe("graph — résolution des @id", () => {
  it("résout les @id relatifs contre baseUrl", () => {
    const document = graph({ baseUrl: "https://x.fr" }, business());
    expect(document["@graph"][0]?.["@id"]).toBe("https://x.fr/#business");
  });

  it("résout les références croisées imbriquées", () => {
    const document = graph(
      { baseUrl: "https://x.fr" },
      business(),
      website({ id: "#website", publisher: "#business" }),
    );
    const site = document["@graph"][1] as { publisher?: { "@id": string } };
    expect(site.publisher).toEqual({ "@id": "https://x.fr/#business" });
  });

  it("laisse les @id déjà absolus intacts", () => {
    const document = graph(
      { baseUrl: "https://x.fr" },
      localBusiness({ id: "https://autre.fr/#business", name: "X" }),
    );
    expect(document["@graph"][0]?.["@id"]).toBe("https://autre.fr/#business");
  });

  it("résout aussi les URLs relatives des nœuds", () => {
    const document = graph(
      { baseUrl: "https://x.fr" },
      website({ id: "#website", url: "/" }),
      breadcrumbs([{ name: "Accueil", url: "/services" }], { id: "#fil" }),
    );
    const site = document["@graph"][0] as { url?: string };
    const trail = document["@graph"][1] as unknown as { itemListElement: { item?: string }[] };
    expect(site.url).toBe("https://x.fr/");
    expect(trail.itemListElement[0]?.item).toBe("https://x.fr/services");
  });

  it("ne réécrit pas les champs textuels qui ressemblent à un chemin", () => {
    const document = graph({ baseUrl: "https://x.fr" }, localBusiness({ id: "#b", name: "/" }));
    expect(document["@graph"][0]).toMatchObject({ name: "/" });
  });

  it("laisse les @id relatifs tels quels sans baseUrl", () => {
    expect(graph(business())["@graph"][0]?.["@id"]).toBe("#business");
  });
});

describe("graph — dédoublonnage", () => {
  it("fusionne deux nœuds partageant le même @id", () => {
    const document = graph(
      localBusiness({ id: "#business", name: "Plomberie Dupont" }),
      localBusiness({ id: "#business", telephone: "+33243123456" }),
    );
    expect(document["@graph"]).toHaveLength(1);
    expect(document["@graph"][0]).toMatchObject({
      "@id": "#business",
      name: "Plomberie Dupont",
      telephone: "+33243123456",
    });
  });

  it("laisse le nœud le plus tardif gagner sur une clé commune", () => {
    const document = graph(
      localBusiness({ id: "#business", name: "Ancien nom" }),
      localBusiness({ id: "#business", name: "Nouveau nom" }),
    );
    expect(document["@graph"][0]).toMatchObject({ name: "Nouveau nom" });
  });

  it("garde la position du premier nœud fusionné", () => {
    const document = graph(
      localBusiness({ id: "#business", name: "A" }),
      website({ id: "#website" }),
      localBusiness({ id: "#business", telephone: "+33243123456" }),
    );
    expect(document["@graph"].map((node) => node["@type"])).toEqual(["LocalBusiness", "WebSite"]);
  });

  it("ne fusionne pas des nœuds sans @id", () => {
    const document = graph(
      faq([{ question: "Q1", answer: "R1" }]),
      faq([{ question: "Q2", answer: "R2" }]),
    );
    expect(document["@graph"]).toHaveLength(2);
  });

  it("avertit en développement quand un @id est dupliqué", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    graph(
      localBusiness({ id: "#business", name: "A" }),
      localBusiness({ id: "#business", name: "B" }),
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain("#business");
  });

  it("reste silencieux en production", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("NODE_ENV", "production");
    graph(
      localBusiness({ id: "#business", name: "A" }),
      localBusiness({ id: "#business", name: "B" }),
    );
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
