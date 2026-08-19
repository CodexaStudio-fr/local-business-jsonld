import { prune } from "./internal/prune.js";

/**
 * Caractères réécrits en échappement Unicode avant d'atterrir dans un
 * `<script>`. Chaque ligne a une raison précise :
 *
 * - `<` — le seul vraiment critique. `JSON.stringify` ne l'échappe pas, donc un
 *   `name` contenant `</script>` ferme la balise et tout ce qui suit devient du
 *   HTML exécutable. C'est la XSS classique du JSON-LD (§8.1).
 * - `>` — inutile seul, mais l'échapper garantit qu'aucune séquence
 *   `</script`, `<!--` ou `]]>` ne peut se reformer par concaténation, y compris
 *   si la sortie est post-traitée par un outil tiers.
 * - `&` — bloque les entités HTML (`&lt;script&gt;`) qu'un navigateur ou un
 *   sanitizeur pourrait re-décoder en chevrons avant de lire le script.
 * - `U+2028` / `U+2029` — séparateurs de ligne Unicode, litéraux valides en JSON
 *   mais interdits dans une chaîne JavaScript. Un outil qui recycle cette sortie
 *   dans du JS (inlining, hydratation) casserait dessus.
 *
 * Ces cinq réécritures sont des échappements **JSON valides** : `JSON.parse`
 * restitue les caractères d'origine, donc aucun parseur JSON-LD n'y voit de
 * différence. Ce n'est pas de l'échappement HTML : les accents ne bougent pas.
 */
const UNSAFE = /[<>&\u2028\u2029]/g;

const ESCAPES: Record<string, string> = {
  "<": "\\u003c",
  ">": "\\u003e",
  "&": "\\u0026",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
};

export interface SerializeOptions {
  /**
   * Indentation, comme le troisième argument de `JSON.stringify`. Par défaut
   * compact : c'est du balisage machine, personne ne le lit dans le HTML servi.
   */
  space?: number | string;
}

/**
 * Sérialise un nœud ou un graphe en chaîne prête à injecter dans
 * `<script type="application/ld+json">`.
 *
 * ```ts
 * const html = `<script type="application/ld+json">${serialize(jsonLd)}</script>`;
 * ```
 *
 * Deux garanties : la sortie est **inerte en HTML** et
 * **déterministe** — les clés sont ordonnées et les valeurs absentes élaguées,
 * donc deux objets équivalents produisent la même chaîne, et les snapshots ne
 * flappent pas (§8.9).
 */
export function serialize(data: object, options: SerializeOptions = {}): string {
  const json = JSON.stringify(prune(data), null, options.space);
  // `JSON.stringify` ne rend `undefined` que pour `undefined` lui-même, jamais
  // pour un objet — mais son type de retour l'inclut.
  if (json === undefined) return "{}";
  return json.replace(UNSAFE, (char) => ESCAPES[char] ?? char);
}
