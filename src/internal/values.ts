import type { OneOrMany } from "../types/input.js";

/**
 * Normalise `T | T[]` en `T[]`. Retourne `undefined` pour une entrée absente,
 * ce qui laisse `prune` faire son travail sans clé parasite.
 */
export function toArray<T>(value: OneOrMany<T> | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  // Casts justifiés : `Array.isArray` ne restreint pas un `readonly T[]` dans une
  // union générique, alors que le test lui-même est correct à l'exécution. La
  // copie garantit qu'on ne renvoie jamais le tableau de l'appelant.
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

/**
 * Joint une liste en une chaîne. schema.org attend un `Text` unique pour
 * `paymentAccepted` ; ses propres exemples utilisent la virgule.
 */
export function joinList(value: OneOrMany<string> | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value.join(", ");
}
