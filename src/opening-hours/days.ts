import type { DayOfWeekName } from "../types/output.js";
import { InvalidDayError } from "./errors.js";

/**
 * Les jours sont manipulés en interne par index **lundi = 0 → dimanche = 6**.
 * C'est l'ordre d'affichage attendu en sortie (§2.3), et ça rend le wrap-around
 * `"Fr-Mo"` trivial.
 */
export const DAY_NAMES: readonly DayOfWeekName[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DAYS_IN_WEEK = 7;

/** Jetons acceptés par le DSL, insensibles à la casse. */
const DAY_TOKENS: Record<string, number> = {
  mo: 0,
  tu: 1,
  we: 2,
  th: 3,
  fr: 4,
  sa: 5,
  su: 6,
};

const ACCEPTED = "Mo, Tu, We, Th, Fr, Sa, Su";

/** Nom schema.org d'un index de jour. */
export function dayName(index: number): DayOfWeekName {
  const name = DAY_NAMES[index];
  if (name === undefined) {
    throw new RangeError(`Index de jour hors bornes : ${index}`);
  }
  return name;
}

/** Traduit un jeton (`"Mo"`, `"mo"`) en index, ou lève une {@link InvalidDayError}. */
export function dayIndex(token: string, position: number): number {
  const index = DAY_TOKENS[token.toLowerCase()];
  if (index === undefined) {
    throw new InvalidDayError(
      `Jour inconnu « ${token} » à la position ${position}. Jours acceptés : ${ACCEPTED}.`,
      token,
      position,
    );
  }
  return index;
}

/**
 * Développe une plage de jours, wrap-around compris : `"Fr-Mo"` donne
 * `{ 4, 5, 6, 0 }` (vendredi, samedi, dimanche, lundi).
 */
export function expandDayRange(from: number, to: number): number[] {
  const days: number[] = [];
  let cursor = from;
  for (let step = 0; step < DAYS_IN_WEEK; step += 1) {
    days.push(cursor);
    if (cursor === to) return days;
    cursor = (cursor + 1) % DAYS_IN_WEEK;
  }
  return days;
}

/** Trie des index de jours et retourne les noms schema.org, lundi → dimanche. */
export function toDayNames(indices: Iterable<number>): DayOfWeekName[] {
  return [...new Set(indices)].sort((a, b) => a - b).map(dayName);
}
