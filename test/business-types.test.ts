import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LOCAL_BUSINESS_TYPES } from "../src/types/business-types.js";

const SOURCE = readFileSync(new URL("../src/types/business-types.ts", import.meta.url), "utf8");

describe("LOCAL_BUSINESS_TYPES", () => {
  it("liste exactement les membres de l'union curée, dans le même ordre", () => {
    const union = SOURCE.slice(0, SOURCE.indexOf("export const LOCAL_BUSINESS_TYPES"));
    const members = [...union.matchAll(/^\s*\|\s*"([A-Za-z]+)"/gm)].map((match) => match[1]);
    expect([...LOCAL_BUSINESS_TYPES]).toEqual(members);
  });

  it("n'est pas vide et contient les sous-types artisans attendus", () => {
    expect(LOCAL_BUSINESS_TYPES).toContain("LocalBusiness");
    expect(LOCAL_BUSINESS_TYPES).toContain("Plumber");
    expect(LOCAL_BUSINESS_TYPES).toContain("Electrician");
    expect(LOCAL_BUSINESS_TYPES).toContain("HairSalon");
  });

  it("ne contient pas VeterinaryCare, qui n'est pas un LocalBusiness", () => {
    expect(LOCAL_BUSINESS_TYPES).not.toContain("VeterinaryCare");
  });
});
