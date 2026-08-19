/**
 * Résolution des `@id` et URLs relatifs.
 *
 * Sans `@id` portant un fragment (`#business`), impossible de relier les nœuds
 * d'un `@graph` — et le graphe perd tout son intérêt (§8.5). Ce module fournit
 * les trois briques : détecter l'absolu, résoudre contre une base, imposer un
 * fragment.
 */

import type { Ref } from "../types/input.js";
import type { IdRef } from "../types/output.js";

/** URL de base inexploitable. */
export class InvalidUrlError extends Error {
  /** La valeur refusée. */
  readonly input: string;

  constructor(message: string, input: string) {
    super(message);
    this.name = "InvalidUrlError";
    this.input = input;
  }
}

/** Un schéma en tête (`https:`, `mailto:`, `tel:`) suffit à dire « absolu ». */
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** `true` si la valeur porte déjà un schéma et n'a donc rien à résoudre. */
export function isAbsoluteUrl(value: string): boolean {
  return SCHEME.test(value);
}

/**
 * Résout `value` contre `baseUrl`.
 *
 * Une valeur déjà absolue est renvoyée **verbatim** : `new URL()` normaliserait
 * `https://x.fr` en `https://x.fr/`, ce qui réécrirait silencieusement les URLs
 * de l'utilisateur et ferait bouger les snapshots.
 *
 * Sans `baseUrl`, une valeur relative est renvoyée telle quelle — `graph()`
 * pourra encore la résoudre plus tard.
 *
 * @throws {InvalidUrlError} si `baseUrl` n'est pas une URL absolue valide
 */
export function resolveUrl(value: string, baseUrl: string | undefined): string {
  if (baseUrl === undefined || isAbsoluteUrl(value)) return value;

  try {
    return new URL(value, baseUrl).href;
  } catch {
    throw new InvalidUrlError(
      `« baseUrl » invalide : « ${baseUrl} ». Attendu une URL absolue, par exemple https://exemple.fr.`,
      baseUrl,
    );
  }
}

/**
 * Garantit qu'un `@id` porte un fragment, en ajoutant `#fallback` s'il n'en a
 * pas. Un `@id` déjà fragmenté est laissé tel quel.
 */
export function withFragment(id: string, fallback: string): string {
  return id.includes("#") ? id : `${id}#${fallback}`;
}

/** Transforme une {@link Ref} en `{ "@id": … }`, base résolue. */
export function toIdRef(ref: Ref, baseUrl: string | undefined): IdRef {
  const id = typeof ref === "string" ? ref : ref["@id"];
  return { "@id": resolveUrl(id, baseUrl) };
}

/**
 * Forme canonique d'une URL absolue : `https://x.fr` devient `https://x.fr/`.
 * Sert à dériver un `@id` propre (`https://x.fr/#business` plutôt que
 * `https://x.fr#business`).
 *
 * Une valeur relative ou non parsable est renvoyée telle quelle : ce n'est pas
 * le rôle de cette fonction de valider les entrées de l'utilisateur.
 */
export function canonicalizeUrl(value: string): string {
  if (!isAbsoluteUrl(value)) return value;
  try {
    return new URL(value).href;
  } catch {
    return value;
  }
}
