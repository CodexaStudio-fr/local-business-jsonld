import { resolveUrl } from "./url.js";

export type NodeRecord = Record<string, unknown>;

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

function asRecord(value: object): NodeRecord {
  return value as NodeRecord;
}

export function isPlainObject(value: unknown): value is NodeRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isGraphDocument(value: object): boolean {
  return Array.isArray(asRecord(value)["@graph"]);
}

export function graphChildren(value: object): object[] {
  const children = asRecord(value)["@graph"];
  return Array.isArray(children) ? children.filter(isPlainObject) : [];
}

export function readId(value: object): string | undefined {
  return readString(value, "@id");
}

export function readType(value: object): string | undefined {
  return readString(value, "@type");
}

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

export function hasKey(value: object, key: string): boolean {
  return key in asRecord(value);
}

/** Copie du nœud sans son `@context`. */
export function stripContext(value: object): NodeRecord {
  const { "@context": _context, ...rest } = asRecord(value);
  return rest;
}

/** Fusion superficielle : sur une clé commune, `second` gagne. */
export function shallowMergeNodes(first: NodeRecord, second: NodeRecord): NodeRecord {
  return { ...first, ...second };
}

/** Recopie `value` en résolvant chaque `@id` et chaque URL relative. */
export function resolveIdsDeep<T>(value: T, baseUrl: string | undefined): T {
  if (baseUrl === undefined) return value;
  return resolveDeep(value, baseUrl, undefined) as T;
}

function resolveDeep(value: unknown, baseUrl: string, key: string | undefined): unknown {
  if (typeof value === "string") {
    return key !== undefined && URL_KEYS.has(key) ? resolveUrl(value, baseUrl) : value;
  }

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

/** Les `@id` trouvés sous la racine, donc les références sortantes du nœud. */
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
