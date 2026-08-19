/**
 * Élagage et normalisation de la sortie JSON-LD.
 *
 * Seul endroit du package autorisé à supprimer des clés. Trois raisons d'exister :
 *
 * 1. **Jamais de `null` ni de `undefined` en sortie.** Un `"telephone": null` est
 *    pire qu'un `telephone` absent : les validateurs le signalent.
 * 2. **Jamais de nœud creux.** Une adresse dont tous les champs sont vides ne doit
 *    pas produire `{"@type":"PostalAddress"}`.
 * 3. **Ordre des clés déterministe**, sinon les snapshots de test flappent.
 */

/**
 * Clés placées en tête, dans cet ordre. Le reste suit par ordre de code-unit
 * (et non `localeCompare`, qui dépend de la locale du process — donc non
 * déterministe d'une machine de CI à l'autre).
 */
const KEY_PRIORITY = ["@context", "@type", "@id", "@graph"];

/** Clés qui, seules, ne suffisent pas à rendre un objet digne d'être émis. */
const STRUCTURAL_KEYS = new Set(["@type", "@context"]);

function keyRank(key: string): number {
  const index = KEY_PRIORITY.indexOf(key);
  return index === -1 ? KEY_PRIORITY.length : index;
}

function compareKeys(a: string, b: string): number {
  const rankDelta = keyRank(a) - keyRank(b);
  if (rankDelta !== 0) return rankDelta;
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Un objet vaut la peine d'être émis s'il porte au moins une clé qui n'est pas
 * purement structurelle. `{"@type":"PostalAddress"}` ne dit rien ; en revanche
 * `{"@type":"Organization","@id":"#business"}` est une référence valide.
 */
function isMeaningful(object: Record<string, unknown>): boolean {
  for (const key of Object.keys(object)) {
    if (!STRUCTURAL_KEYS.has(key)) return true;
  }
  return false;
}

/** Retourne la valeur élaguée, ou `undefined` pour signifier « à supprimer ». */
function pruneValue(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }

  // NaN et ±Infinity sérialisent en `null` : les supprimer maintenant.
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;

  if (typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (const item of value) {
      const pruned = pruneValue(item);
      if (pruned !== undefined) items.push(pruned);
    }
    return items.length > 0 ? items : undefined;
  }

  if (typeof value === "object") {
    // Cast justifié : on vient d'écarter null, les tableaux et les primitives ;
    // il ne reste qu'un objet, dont on ne lit les clés que via `Object.keys`.
    const pruned = pruneObject(value as Record<string, unknown>);
    return isMeaningful(pruned) ? pruned : undefined;
  }

  // Fonctions, symboles, bigint : rien de tout ça n'a de place dans du JSON-LD.
  return undefined;
}

function pruneObject(input: Record<string, unknown>): Record<string, unknown> {
  const keys: string[] = [];
  const values = new Map<string, unknown>();

  for (const key of Object.keys(input)) {
    const pruned = pruneValue(input[key]);
    if (pruned !== undefined) {
      keys.push(key);
      values.set(key, pruned);
    }
  }

  keys.sort(compareKeys);

  const output: Record<string, unknown> = {};
  for (const key of keys) output[key] = values.get(key);
  return output;
}

/**
 * Élague récursivement `value` : retire `undefined`, `null`, chaînes vides,
 * nombres non finis, tableaux vides et objets creux ; normalise les chaînes
 * (`trim`) ; ordonne les clés. L'entrée n'est jamais modifiée.
 *
 * L'objet racine est toujours conservé, même s'il finit vide.
 */
export function prune<T extends object>(value: T): T {
  // Cast justifié : `prune` ne fait que retirer des clés optionnelles et
  // normaliser des chaînes. La forme de `T` reste valide pour tout appelant,
  // et les builders ne construisent que des objets dont les champs retirés
  // sont déclarés optionnels.
  return pruneObject(value as Record<string, unknown>) as T;
}
