import { describe, expect, it } from "vitest";
import { InvalidPhoneError, normalizePhone } from "../src/internal/phone.js";

describe("normalizePhone — déjà international", () => {
  it("laisse un E.164 propre intact", () => {
    expect(normalizePhone("+33243123456")).toBe("+33243123456");
  });

  it("retire les espaces d'un numéro international", () => {
    expect(normalizePhone("+33 2 43 12 34 56")).toBe("+33243123456");
  });

  it("retire les points, tirets et parenthèses", () => {
    expect(normalizePhone("+33-2.43.12.34.56")).toBe("+33243123456");
  });

  it("retire le « (0) » de la notation mixte française", () => {
    expect(normalizePhone("+33 (0)2 43 12 34 56")).toBe("+33243123456");
  });

  it("convertit le préfixe 00 en +", () => {
    expect(normalizePhone("0033243123456")).toBe("+33243123456");
  });
});

describe("normalizePhone — format national", () => {
  it("convertit un fixe français en E.164", () => {
    expect(normalizePhone("02 43 12 34 56", "FR")).toBe("+33243123456");
  });

  it("convertit un mobile français en E.164", () => {
    expect(normalizePhone("06 12 34 56 78", "FR")).toBe("+33612345678");
  });

  it("accepte les séparateurs en points", () => {
    expect(normalizePhone("02.43.12.34.56", "FR")).toBe("+33243123456");
  });

  it("accepte un numéro déjà sans le zéro de tête", () => {
    expect(normalizePhone("243123456", "FR")).toBe("+33243123456");
  });

  it("accepte un code pays en minuscules", () => {
    expect(normalizePhone("02 43 12 34 56", "fr")).toBe("+33243123456");
  });

  it("convertit un numéro belge", () => {
    expect(normalizePhone("02 123 45 67", "BE")).toBe("+3221234567");
  });

  it("conserve le zéro de tête en Italie, qui ne le retire pas", () => {
    expect(normalizePhone("02 1234567", "IT")).toBe("+39021234567");
  });
});

describe("normalizePhone — refus", () => {
  it("refuse un national sans code pays (ambigu, §8.6)", () => {
    expect(() => normalizePhone("02 43 12 34 56")).toThrow(InvalidPhoneError);
  });

  it("explique comment corriger un numéro ambigu", () => {
    expect(() => normalizePhone("02 43 12 34 56")).toThrow(/E\.164/);
  });

  it("refuse un code pays inconnu", () => {
    expect(() => normalizePhone("02 43 12 34 56", "ZZ")).toThrow(InvalidPhoneError);
  });

  it("refuse des lettres au milieu du numéro", () => {
    expect(() => normalizePhone("+33 2 43 SOS 56")).toThrow(InvalidPhoneError);
  });

  it("refuse un numéro trop court", () => {
    expect(() => normalizePhone("+331234")).toThrow(InvalidPhoneError);
  });

  it("refuse un numéro au-delà des 15 chiffres d'E.164", () => {
    expect(() => normalizePhone("+3312345678901234")).toThrow(InvalidPhoneError);
  });

  it("refuse une chaîne vide", () => {
    expect(() => normalizePhone("")).toThrow(InvalidPhoneError);
  });

  it("expose le numéro fautif sur l'erreur", () => {
    let caught: unknown;
    try {
      normalizePhone("02 43 12 34 56");
    } catch (error) {
      caught = error;
    }
    expect((caught as InvalidPhoneError).input).toBe("02 43 12 34 56");
  });
});
