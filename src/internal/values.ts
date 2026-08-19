import type { OneOrMany } from "../types/input.js";

/** Normalise `T | readonly T[]` en `T[]`, en copiant le tableau de l'appelant. */
export function toArray<T>(value: OneOrMany<T> | undefined): T[] | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? [...(value as readonly T[])] : [value as T];
}

/** Joint une liste par `", "` : schema.org attend un `Text` unique. */
export function joinList(value: OneOrMany<string> | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "string" ? value : value.join(", ");
}
