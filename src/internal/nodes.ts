/**
 * Manipulation bas niveau des nœuds JSON-LD : c'est le seul endroit, avec
 * `prune`, qui traite un nœud comme un sac de clés. Les casts vivent ici pour
 * que `builders/graph.ts` reste typé de bout en bout.
 */

import { resolveUrl } from "./url.js";

/** Vue « sac de clés » d'un nœud. */
export type NodeRecord = Record<string, unknown>;

/**
 * Cast justifié : tous les nœuds produits par ce package sont des objets JSON
 * simples. On ne fait que lire des clés et en recopier.
 */
function asRecord(value: object): NodeRecord {
  return value as NodeRecord;
}

/** `true` si la valeur ressemble à un objet JSON (ni null, ni tableau). */
export function isPlainObject(value: unknown): value is NodeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `true` si la valeur est un document `{ "@context", "@graph" }`. */
export function isGraphDocument(value: object): boolean {
  return Array.isArray(asRecord(value)["@graph"]);
}

/** Les enfants d'un document de graphe. */
export function graphChildren(value: object): object[] {
  const children = asRecord(value)["@graph"];
  return Array.isArray(children) ? children.filter(isPlainObject) : [];
}

/** L'`@id` d'un nœud, s'il en porte un. */
export function readId(value: object): string | undefined {
  const id = asRecord(value)["@id"];
  return typeof id === "string" ? id : undefined;
}

/** Le `@type` d'un nœud, pour les messages d'avertissement. */
export function readType(value: object): string | undefined {
  const type = asRecord(value)["@type"];
  return typeof type === "string" ? type : undefined;
}

/** Copie du nœud sans son `@context` : les enfants d'un `@graph` n'en portent pas. */
export function stripContext(value: object): NodeRecord {
  const { "@context": _context, ...rest } = asRecord(value);
  return rest;
}

/**
 * Fusion superficielle de deux nœuds de même `@id`. Le second gagne sur les
 * clés communes — dernière écriture, comportement le moins surprenant.
 */
export function shallowMergeNodes(first: NodeRecord, second: NodeRecord): NodeRecord {
  return { ...first, ...second };
}

/**
 * Clés dont la valeur est une URL dans le vocabulaire que ce package émet.
 *
 * Ce n'est pas une heuristique : la liste est exhaustive par construction, on
 * contrôle chaque clé produite par les builders. Une clé absente d'ici n'est
 * jamais réécrite, donc aucun `name` ou `description` ne risque d'y passer.
 */
const URL_KEYS = new Set([
  "@id",
  "contentUrl",
  "hasMap",
  "image",
  "item",
  "logo",
  "sameAs",
  "url",
  "urlTemplate",
]);

/**
 * Recopie `value` en résolvant contre `baseUrl` chaque `@id` et chaque URL
 * relative. Traiter toutes les clés `@id` de la même façon règle d'un coup les
 * identifiants de nœuds et les références croisées (`{"@id":"#business"}`).
 */
export function resolveIdsDeep<T>(value: T, baseUrl: string | undefined): T {
  if (baseUrl === undefined) return value;
  // Cast justifié : `resolveDeep` ne remplace que des `string` par d'autres
  // `string`, sous des clés déjà typées `string`. La forme de `T` est préservée.
  return resolveDeep(value, baseUrl, undefined) as T;
}

function resolveDeep(value: unknown, baseUrl: string, key: string | undefined): unknown {
  if (typeof value === "string") {
    return key !== undefined && URL_KEYS.has(key) ? resolveUrl(value, baseUrl) : value;
  }

  // Le contexte de clé traverse les tableaux : `image: ["/a.jpg"]` doit être
  // résolu comme `image: "/a.jpg"`.
  if (Array.isArray(value)) return value.map((item) => resolveDeep(item, baseUrl, key));

  if (isPlainObject(value)) {
    const output: NodeRecord = {};
    for (const [childKey, child] of Object.entries(value)) {
      output[childKey] = resolveDeep(child, baseUrl, childKey);
    }
    return output;
  }

  return value;
}

/** Lecture typée d'une clé de nœud : `undefined` si absente ou du mauvais type. */
export function readString(value: object, key: string): string | undefined {
  const raw = asRecord(value)[key];
  return typeof raw === "string" ? raw : undefined;
}

export function readNumber(value: object, key: string): number | undefined {
  const raw = asRecord(value)[key];
  return typeof raw === "number" ? raw : undefined;
}

export function readArray(value: object, key: string): unknown[] | undefined {
  const raw = asRecord(value)[key];
  return Array.isArray(raw) ? raw : undefined;
}

export function readObject(value: object, key: string): NodeRecord | undefined {
  const raw = asRecord(value)[key];
  return isPlainObject(raw) ? raw : undefined;
}

/** `true` si la clé est présente, quelle que soit sa valeur. */
export function hasKey(value: object, key: string): boolean {
  return key in asRecord(value);
}

/**
 * Tous les `@id` trouvés **sous** la racine — donc les références sortantes du
 * nœud, sans son propre identifiant.
 */
export function collectNestedIds(value: object): Set<string> {
  const found = new Set<string>();
  for (const child of Object.values(asRecord(value))) collectIds(child, found);
  return found;
}

function collectIds(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, found);
    return;
  }
  if (!isPlainObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    if (key === "@id" && typeof child === "string") {
      found.add(child);
    } else {
      collectIds(child, found);
    }
  }
}
