import type { DayOfWeekName } from "../types/output.js";
import { InvalidDayError } from "./errors.js";

/** Jours dans l'ordre de sortie : lundi = 0, dimanche = 6. */
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

const DAY_TOKENS: Record<string, number> = {
  mo: 0,
  tu: 1,
  we: 2,
  th: 3,
  fr: 4,
  sa: 5,
  su: 6,
};

const ACCEPTED_TOKENS = "Mo, Tu, We, Th, Fr, Sa, Su";

/** Nom schema.org d'un index de jour. */
export function dayName(index: number): DayOfWeekName {
  const name = DAY_NAMES[index];
  if (name === undefined) {
    throw new RangeError(`Index de jour hors bornes : ${index}`);
  }
  return name;
}

/** Traduit un jeton (`"Mo"`, `"mo"`) en index de jour. */
export function dayIndex(token: string, position: number): number {
  const index = DAY_TOKENS[token.toLowerCase()];
  if (index === undefined) {
    throw new InvalidDayError(
      `Jour inconnu « ${token} » à la position ${position}. Jours acceptés : ${ACCEPTED_TOKENS}.`,
      token,
      position,
    );
  }
  return index;
}

/** Développe une plage de jours, wrap-around compris : `Fr-Mo` donne 4, 5, 6, 0. */
export function expandDayRange(from: number, to: number): number[] {
  const days: number[] = [];
  let cursor = from;
  for (let step = 0; step < DAYS_IN_WEEK; step += 1) {
    days.push(cursor);
    if (cursor === to) break;
    cursor = (cursor + 1) % DAYS_IN_WEEK;
  }
  return days;
}

/** Trie des index de jours et retourne leurs noms, lundi puis dimanche. */
export function toDayNames(indices: Iterable<number>): DayOfWeekName[] {
  return [...new Set(indices)].sort((a, b) => a - b).map(dayName);
}
