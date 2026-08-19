import { describe, expect, it } from "vitest";
import {
  InvalidDateError,
  InvalidDayError,
  InvalidTimeError,
  OpeningHoursError,
  parseOpeningHours,
  parseSpecialOpeningHours,
} from "../src/opening-hours/index.js";

/** Raccourci de lecture pour les attentes. */
const spec = (dayOfWeek: string[], opens: string, closes: string) => ({
  "@type": "OpeningHoursSpecification",
  dayOfWeek,
  opens,
  closes,
});

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS = [...WEEKDAYS, "Saturday", "Sunday"];

// ─────────────────────────────────────────────────────────────────────────────
// §2.2 — tableau des cas limites, une ligne = un test
// ─────────────────────────────────────────────────────────────────────────────

describe("§2.2 cas limites", () => {
  it('"Mo-Fr 09:00-18:00" → 1 spec, lundi à vendredi', () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00")).toEqual([spec(WEEKDAYS, "09:00", "18:00")]);
  });

  it('"Mo,We,Fr 09:00-12:00" → 1 spec, 3 jours', () => {
    expect(parseOpeningHours("Mo,We,Fr 09:00-12:00")).toEqual([
      spec(["Monday", "Wednesday", "Friday"], "09:00", "12:00"),
    ]);
  });

  it('"Mo-Fr 08:00-12:00,14:00-18:00" → 2 specs (une par créneau), mêmes jours', () => {
    expect(parseOpeningHours("Mo-Fr 08:00-12:00,14:00-18:00")).toEqual([
      spec(WEEKDAYS, "08:00", "12:00"),
      spec(WEEKDAYS, "14:00", "18:00"),
    ]);
  });

  it('"Mo-Fr 09:00-18:00; Sa 09:00-12:00" → 2 specs, jours distincts', () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00; Sa 09:00-12:00")).toEqual([
      spec(WEEKDAYS, "09:00", "18:00"),
      spec(["Saturday"], "09:00", "12:00"),
    ]);
  });

  it('"Mo-Su 00:00-23:59" → 1 spec, 7 jours', () => {
    expect(parseOpeningHours("Mo-Su 00:00-23:59")).toEqual([spec(ALL_DAYS, "00:00", "23:59")]);
  });

  it('"24/7" → 1 spec, 7 jours, 00:00 → 23:59 (convention Google)', () => {
    expect(parseOpeningHours("24/7")).toEqual([spec(ALL_DAYS, "00:00", "23:59")]);
  });

  it('"Th 22:00-02:00" → spec unique qui chevauche minuit, closes "02:00"', () => {
    expect(parseOpeningHours("Th 22:00-02:00")).toEqual([spec(["Thursday"], "22:00", "02:00")]);
  });

  it('"Su off" → dimanche absent de la sortie, pas de spec vide', () => {
    expect(parseOpeningHours("Su off")).toEqual([]);
  });

  it('"Mo-Fr 09:00-18:00; We off" → mercredi retiré du groupe', () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00; We off")).toEqual([
      spec(["Monday", "Tuesday", "Thursday", "Friday"], "09:00", "18:00"),
    ]);
  });

  it('"Fr-Mo 09:00-18:00" → wrap-around Fr,Sa,Su,Mo, réordonné lundi → dimanche (§2.3)', () => {
    expect(parseOpeningHours("Fr-Mo 09:00-18:00")).toEqual([
      spec(["Monday", "Friday", "Saturday", "Sunday"], "09:00", "18:00"),
    ]);
  });

  it('"Mo 25:00-26:00" → InvalidTimeError', () => {
    expect(() => parseOpeningHours("Mo 25:00-26:00")).toThrow(InvalidTimeError);
  });

  it('"Xx 09:00-18:00" → InvalidDayError avec la position dans la chaîne', () => {
    let caught: unknown;
    try {
      parseOpeningHours("Xx 09:00-18:00");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InvalidDayError);
    const error = caught as InvalidDayError;
    expect(error.position).toBe(0);
    expect(error.token).toBe("Xx");
    expect(error.message).toContain("0");
  });

  it('"" → [] sans throw', () => {
    expect(parseOpeningHours("")).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §2.3 — fusion des jours partageant exactement les mêmes créneaux
// ─────────────────────────────────────────────────────────────────────────────

describe("§2.3 fusion", () => {
  it("fusionne Mo-Fr 9-18 et Sa 9-18 en une seule spec de 6 jours", () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00; Sa 09:00-18:00")).toEqual([
      spec([...WEEKDAYS, "Saturday"], "09:00", "18:00"),
    ]);
  });

  it("ne fusionne pas des jours dont les créneaux diffèrent partiellement", () => {
    expect(parseOpeningHours("Mo 08:00-12:00,14:00-18:00; Tu 08:00-12:00")).toEqual([
      spec(["Monday"], "08:00", "12:00"),
      spec(["Monday"], "14:00", "18:00"),
      spec(["Tuesday"], "08:00", "12:00"),
    ]);
  });

  it("fusionne des jours dont les deux créneaux sont identiques", () => {
    expect(parseOpeningHours("Mo 08:00-12:00,14:00-18:00; Tu 14:00-18:00,08:00-12:00")).toEqual([
      spec(["Monday", "Tuesday"], "08:00", "12:00"),
      spec(["Monday", "Tuesday"], "14:00", "18:00"),
    ]);
  });

  it("ordonne les jours lundi → dimanche, jamais dans l'ordre d'écriture", () => {
    const result = parseOpeningHours("Sa,Su,Mo 09:00-18:00");
    expect(result[0]?.dayOfWeek).toEqual(["Monday", "Saturday", "Sunday"]);
  });

  it("ordonne les groupes par premier jour de la semaine", () => {
    const result = parseOpeningHours("Sa 10:00-12:00; Mo 09:00-18:00");
    expect(result.map((s) => s.dayOfWeek)).toEqual([["Monday"], ["Saturday"]]);
  });

  it("ordonne les créneaux d'un même groupe par heure d'ouverture", () => {
    const result = parseOpeningHours("Mo 14:00-18:00,08:00-12:00");
    expect(result.map((s) => s.opens)).toEqual(["08:00", "14:00"]);
  });

  it("dédoublonne des créneaux identiques répétés", () => {
    expect(parseOpeningHours("Mo 09:00-12:00,09:00-12:00")).toEqual([
      spec(["Monday"], "09:00", "12:00"),
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Règle de recouvrement : la dernière mention d'un jour gagne
// ─────────────────────────────────────────────────────────────────────────────

describe("recouvrement des règles", () => {
  it("une règle ultérieure remplace les créneaux du jour qu'elle nomme", () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00; Fr 09:00-12:00")).toEqual([
      spec(["Monday", "Tuesday", "Wednesday", "Thursday"], "09:00", "18:00"),
      spec(["Friday"], "09:00", "12:00"),
    ]);
  });

  it("un jour rouvert après un off reprend les créneaux de la dernière règle", () => {
    expect(parseOpeningHours("Mo-Su off; Sa 09:00-12:00")).toEqual([
      spec(["Saturday"], "09:00", "12:00"),
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Tolérance de la grammaire (§2.1)
// ─────────────────────────────────────────────────────────────────────────────

describe("§2.1 tolérance de syntaxe", () => {
  it("est insensible à la casse", () => {
    expect(parseOpeningHours("mo-fr 09:00-18:00")).toEqual([spec(WEEKDAYS, "09:00", "18:00")]);
  });

  it("tolère les espaces libres", () => {
    expect(parseOpeningHours("  Mo - Fr   09:00 - 18:00  ")).toEqual([
      spec(WEEKDAYS, "09:00", "18:00"),
    ]);
  });

  it("tolère un point-virgule final", () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00;")).toEqual([spec(WEEKDAYS, "09:00", "18:00")]);
  });

  it("tolère les règles vides entre points-virgules", () => {
    expect(parseOpeningHours("Mo-Fr 09:00-18:00;; Sa 09:00-12:00")).toEqual([
      spec(WEEKDAYS, "09:00", "18:00"),
      spec(["Saturday"], "09:00", "12:00"),
    ]);
  });

  it("accepte une heure sur un seul chiffre et la normalise", () => {
    expect(parseOpeningHours("Mo 9:00-18:00")).toEqual([spec(["Monday"], "09:00", "18:00")]);
  });

  it("accepte un tableau de chaînes, traité comme des règles successives", () => {
    expect(parseOpeningHours(["Mo-Fr 09:00-18:00", "Sa 09:00-12:00"])).toEqual([
      spec(WEEKDAYS, "09:00", "18:00"),
      spec(["Saturday"], "09:00", "12:00"),
    ]);
  });

  it("traite une chaîne d'espaces comme vide", () => {
    expect(parseOpeningHours("   ")).toEqual([]);
  });

  it('accepte "OFF" en majuscules', () => {
    expect(parseOpeningHours("Mo-Su 09:00-18:00; SU OFF")).toEqual([
      spec(WEEKDAYS.concat("Saturday"), "09:00", "18:00"),
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §8.4 — convention des 24 heures
// ─────────────────────────────────────────────────────────────────────────────

describe("§8.4 convention 24 h", () => {
  it('normalise "24:00" en "23:59"', () => {
    expect(parseOpeningHours("Mo 09:00-24:00")).toEqual([spec(["Monday"], "09:00", "23:59")]);
  });

  it('"Mo-Su 00:00-24:00" équivaut à 24/7', () => {
    expect(parseOpeningHours("Mo-Su 00:00-24:00")).toEqual([spec(ALL_DAYS, "00:00", "23:59")]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Erreurs
// ─────────────────────────────────────────────────────────────────────────────

describe("erreurs", () => {
  it("InvalidDayError et InvalidTimeError dérivent d'OpeningHoursError", () => {
    expect(() => parseOpeningHours("Xx 09:00-18:00")).toThrow(OpeningHoursError);
    expect(() => parseOpeningHours("Mo 25:00-26:00")).toThrow(OpeningHoursError);
  });

  it("rejette les minutes hors bornes", () => {
    expect(() => parseOpeningHours("Mo 09:60-18:00")).toThrow(InvalidTimeError);
  });

  it("rejette une heure au-delà de 24:00", () => {
    expect(() => parseOpeningHours("Mo 09:00-24:30")).toThrow(InvalidTimeError);
  });

  it("rejette un créneau de durée nulle", () => {
    expect(() => parseOpeningHours("Mo 09:00-09:00")).toThrow(InvalidTimeError);
  });

  it("rejette une heure sans deux-points", () => {
    expect(() => parseOpeningHours("Mo 0900-1800")).toThrow(InvalidTimeError);
  });

  it("rejette un créneau sans jour et suggère la forme correcte", () => {
    let caught: unknown;
    try {
      parseOpeningHours("09:00-18:00");
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InvalidDayError);
    expect((caught as InvalidDayError).message).toContain("Mo-Su");
  });

  it("rejette une borne de plage de jours invalide", () => {
    expect(() => parseOpeningHours("Mo-Zz 09:00-18:00")).toThrow(InvalidDayError);
  });

  it("signale la position du jour fautif dans la chaîne complète", () => {
    let caught: unknown;
    try {
      parseOpeningHours("Mo-Fr 09:00-18:00; Xx 09:00-12:00");
    } catch (error) {
      caught = error;
    }
    expect((caught as InvalidDayError).position).toBe(19);
  });

  it("rejette une règle sans créneau ni off", () => {
    expect(() => parseOpeningHours("Mo")).toThrow(OpeningHoursError);
  });

  it("rejette un créneau incomplet", () => {
    expect(() => parseOpeningHours("Mo 09:00-")).toThrow(InvalidTimeError);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// §2.4 — horaires exceptionnels
// ─────────────────────────────────────────────────────────────────────────────

describe("§2.4 horaires exceptionnels", () => {
  it("un jour fermé produit opens 00:00 / closes 00:00 sur un seul jour", () => {
    expect(parseSpecialOpeningHours([{ date: "2026-12-25", closed: true }])).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        opens: "00:00",
        closes: "00:00",
        validFrom: "2026-12-25",
        validThrough: "2026-12-25",
      },
    ]);
  });

  it("une période fermée porte validFrom et validThrough", () => {
    expect(
      parseSpecialOpeningHours([{ from: "2026-08-01", to: "2026-08-15", closed: true }]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        opens: "00:00",
        closes: "00:00",
        validFrom: "2026-08-01",
        validThrough: "2026-08-15",
      },
    ]);
  });

  it("un jour aux horaires réduits conserve opens et closes", () => {
    expect(
      parseSpecialOpeningHours([{ date: "2026-07-14", opens: "10:00", closes: "16:00" }]),
    ).toEqual([
      {
        "@type": "OpeningHoursSpecification",
        opens: "10:00",
        closes: "16:00",
        validFrom: "2026-07-14",
        validThrough: "2026-07-14",
      },
    ]);
  });

  it("normalise les heures exceptionnelles comme le DSL", () => {
    const result = parseSpecialOpeningHours([
      { date: "2026-07-14", opens: "9:00", closes: "24:00" },
    ]);
    expect(result[0]?.opens).toBe("09:00");
    expect(result[0]?.closes).toBe("23:59");
  });

  it("conserve l'ordre des entrées", () => {
    const result = parseSpecialOpeningHours([
      { date: "2026-12-25", closed: true },
      { date: "2026-01-01", closed: true },
    ]);
    expect(result.map((s) => s.validFrom)).toEqual(["2026-12-25", "2026-01-01"]);
  });

  it("retourne [] pour une liste vide", () => {
    expect(parseSpecialOpeningHours([])).toEqual([]);
  });

  it("rejette une date mal formée", () => {
    expect(() => parseSpecialOpeningHours([{ date: "25/12/2026", closed: true }])).toThrow(
      InvalidDateError,
    );
  });

  it("rejette une date impossible", () => {
    expect(() => parseSpecialOpeningHours([{ date: "2026-02-30", closed: true }])).toThrow(
      InvalidDateError,
    );
  });

  it("rejette une entrée sans date ni période", () => {
    expect(() => parseSpecialOpeningHours([{ closed: true }])).toThrow(OpeningHoursError);
  });

  it("rejette une entrée qui mélange date et période", () => {
    expect(() => parseSpecialOpeningHours([{ date: "2026-12-25", from: "2026-12-24" }])).toThrow(
      OpeningHoursError,
    );
  });

  it("rejette une période dont la fin précède le début", () => {
    expect(() =>
      parseSpecialOpeningHours([{ from: "2026-08-15", to: "2026-08-01", closed: true }]),
    ).toThrow(InvalidDateError);
  });

  it("rejette une entrée ouverte sans horaires", () => {
    expect(() => parseSpecialOpeningHours([{ date: "2026-07-14" }])).toThrow(OpeningHoursError);
  });

  it("rejette une entrée ouverte qui ne fournit qu'une seule borne", () => {
    expect(() => parseSpecialOpeningHours([{ date: "2026-07-14", opens: "10:00" }])).toThrow(
      OpeningHoursError,
    );
  });

  it("rejette une entrée fermée qui fournit aussi des horaires", () => {
    expect(() =>
      parseSpecialOpeningHours([{ date: "2026-07-14", closed: true, opens: "10:00" }]),
    ).toThrow(OpeningHoursError);
  });
});
