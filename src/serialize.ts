import { prune } from "./internal/prune.js";

const UNSAFE = /[<>&\u2028\u2029]/g;

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export interface SerializeOptions {
  /** Indentation, comme le troisième argument de `JSON.stringify`. */
  space?: number | string;
}

/**
 * Sérialise un nœud ou un graphe en chaîne prête pour un
 * `<script type="application/ld+json">` : JSON valide, mais inerte en HTML.
 */
export function serialize(data: object, options: SerializeOptions = {}): string {
  const json = JSON.stringify(prune(data), null, options.space);
  if (json === undefined) return "{}";
  return json.replace(UNSAFE, (char) => ESCAPES[char] ?? char);
}
