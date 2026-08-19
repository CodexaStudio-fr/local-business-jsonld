import { warnInDev } from "../internal/dev.js";
import {
  graphChildren,
  isGraphDocument,
  isPlainObject,
  type NodeRecord,
  readId,
  readType,
  resolveIdsDeep,
  shallowMergeNodes,
  stripContext,
} from "../internal/nodes.js";
import { prune } from "../internal/prune.js";
import type { GraphOptions } from "../types/input.js";
import type { GraphChild, GraphDocument } from "../types/output.js";
import { SCHEMA_CONTEXT } from "./shared.js";

/** Un nœud de builder, un autre graphe (aplati), ou rien. */
export type GraphMember = { "@type": string } | GraphDocument | null | undefined;

function isOptions(value: unknown): value is GraphOptions {
  return isPlainObject(value) && !("@type" in value) && !("@graph" in value);
}

function flatten(members: readonly GraphMember[]): object[] {
  const nodes: object[] = [];
  for (const member of members) {
    if (member === null || member === undefined) continue;
    if (isGraphDocument(member)) {
      nodes.push(...graphChildren(member));
    } else {
      nodes.push(member);
    }
  }
  return nodes;
}

function duplicateWarning(id: string, first: NodeRecord, second: NodeRecord): string {
  const types = `${readType(first) ?? "?"} puis ${readType(second) ?? "?"}`;
  return `@id dupliqué dans le @graph : "${id}" (${types}). Les deux nœuds sont fusionnés ; sur une clé commune, le dernier gagne.`;
}

/**
 * Compose plusieurs nœuds en un document `@graph` : un seul `@context` à la
 * racine, `@id` et URLs relatifs résolus, nœuds de même `@id` fusionnés.
 */
export function graph(...nodes: GraphMember[]): GraphDocument;
export function graph(options: GraphOptions, ...nodes: GraphMember[]): GraphDocument;
export function graph(...args: (GraphOptions | GraphMember)[]): GraphDocument {
  const [first, ...rest] = args;
  const hasOptions = isOptions(first);
  const { baseUrl } = hasOptions ? first : {};
  const members = (hasOptions ? rest : args) as GraphMember[];

  const children: NodeRecord[] = [];
  const positions = new Map<string, number>();

  for (const raw of flatten(members)) {
    const node = stripContext(resolveIdsDeep(raw, baseUrl));
    const id = readId(node);

    if (id === undefined) {
      children.push(node);
      continue;
    }

    const at = positions.get(id);
    const existing = at === undefined ? undefined : children[at];

    if (at === undefined || existing === undefined) {
      positions.set(id, children.length);
      children.push(node);
      continue;
    }

    warnInDev(duplicateWarning(id, existing, node));
    children[at] = shallowMergeNodes(existing, node);
  }

  if (children.length === 0) {
    throw new TypeError(
      "graph() sans nœud : passer au moins un nœud construit par un builder (localBusiness, website, ...).",
    );
  }

  return prune({ "@context": SCHEMA_CONTEXT, "@graph": children as unknown as GraphChild[] });
}
