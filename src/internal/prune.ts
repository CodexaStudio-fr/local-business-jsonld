const KEY_PRIORITY = ["@context", "@type", "@id", "@graph"];
const STRUCTURAL_KEYS = new Set(["@type", "@context"]);

function keyRank(key: string): number {
  const index = KEY_PRIORITY.indexOf(key);
  return index === -1 ? KEY_PRIORITY.length : index;
}

function compareKeys(a: string, b: string): number {
  const byRank = keyRank(a) - keyRank(b);
  if (byRank !== 0) return byRank;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function isMeaningful(object: Record<string, unknown>): boolean {
  return Object.keys(object).some((key) => !STRUCTURAL_KEYS.has(key));
}

function pruneValue(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    const items = value.map(pruneValue).filter((item) => item !== undefined);
    return items.length > 0 ? items : undefined;
  }

  if (typeof value === "object") {
    const pruned = pruneObject(value as Record<string, unknown>);
    return isMeaningful(pruned) ? pruned : undefined;
  }

  return undefined;
}

function pruneObject(input: Record<string, unknown>): Record<string, unknown> {
  const kept = new Map<string, unknown>();

  for (const key of Object.keys(input)) {
    const pruned = pruneValue(input[key]);
    if (pruned !== undefined) kept.set(key, pruned);
  }

  const output: Record<string, unknown> = {};
  for (const key of [...kept.keys()].sort(compareKeys)) {
    output[key] = kept.get(key);
  }
  return output;
}

/**
 * Élague récursivement les valeurs vides, trime les chaînes, ordonne les clés.
 * L'entrée n'est pas modifiée ; l'objet racine est toujours conservé.
 */
export function prune<T extends object>(value: T): T {
  return pruneObject(value as Record<string, unknown>) as T;
}
