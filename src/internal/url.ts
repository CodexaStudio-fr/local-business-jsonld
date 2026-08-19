import type { Ref } from "../types/input.js";
import type { IdRef } from "../types/output.js";

/** URL de base inexploitable. */
export class InvalidUrlError extends Error {
  readonly input: string;

  constructor(message: string, input: string) {
    super(message);
    this.name = "InvalidUrlError";
    this.input = input;
  }
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;

/** `true` si la valeur porte déjà un schéma et n'a donc rien à résoudre. */
export function isAbsoluteUrl(value: string): boolean {
  return SCHEME.test(value);
}

/** Résout `value` contre `baseUrl`. Une valeur absolue est renvoyée verbatim. */
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

/** Ajoute `#fallback` à un `@id` qui ne porte pas encore de fragment. */
export function withFragment(id: string, fallback: string): string {
  return id.includes("#") ? id : `${id}#${fallback}`;
}

/** Transforme une référence en `{ "@id": … }`, base résolue. */
export function toIdRef(ref: Ref, baseUrl: string | undefined): IdRef {
  const id = typeof ref === "string" ? ref : ref["@id"];
  return { "@id": resolveUrl(id, baseUrl) };
}

/** Forme canonique d'une URL absolue : `https://x.fr` devient `https://x.fr/`. */
export function canonicalizeUrl(value: string): string {
  if (!isAbsoluteUrl(value)) return value;
  try {
    return new URL(value).href;
  } catch {
    return value;
  }
}
