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

/**
 * Ce que `graph()` accepte : un nœud de builder, un autre graphe (aplati), ou
 * rien du tout — pour composer conditionnellement sans `filter(Boolean)`.
 */
export type GraphMember = { "@type": string } | GraphDocument | null | undefined;

/**
 * Emplacement dans le graphe final. Un nœud identifié est référencé par son
 * `@id` (il peut encore être fusionné) ; un nœud anonyme est figé sur place.
 */
type Slot = { identified: string } | { anonymous: NodeRecord };

function isOptions(value: unknown): value is GraphOptions {
  return isPlainObject(value) && !("@type" in value) && !("@graph" in value);
}

/** Aplatit les graphes imbriqués et écarte les membres absents. */
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

/**
 * Compose plusieurs nœuds en un seul document `@graph`.
 *
 * ```ts
 * graph(
 *   { baseUrl: "https://plomberie-dupont.fr" },
 *   localBusiness({ id: "#business" }),
 *   website({ id: "#website", publisher: "#business" }),
 *   breadcrumbs(etapes, { id: "#fil" }),
 * );
 * ```
 *
 * Ce que la fonction garantit :
 *
 * - **Un seul `@context`**, hissé à la racine et retiré de chaque enfant. Des
 *   enfants qui gardent leur `@context` sont l'erreur classique du `@graph`
 *   (§8.2) : le validateur schema.org laisse parfois passer, Google non.
 * - **Les `@id` relatifs résolus** contre `baseUrl`, aussi bien les
 *   identifiants de nœuds que les références croisées imbriquées.
 * - **Un `@id` par nœud** : deux nœuds de même `@id` sont fusionnés
 *   superficiellement (le dernier gagne sur les clés communes), avec un
 *   avertissement hors production.
 * - **L'ordre d'écriture préservé** ; un nœud fusionné garde la position de sa
 *   première occurrence.
 *
 * @throws {TypeError} si aucun nœud ne subsiste
 */
export function graph(...nodes: GraphMember[]): GraphDocument;
export function graph(options: GraphOptions, ...nodes: GraphMember[]): GraphDocument;
export function graph(...args: (GraphOptions | GraphMember)[]): GraphDocument {
  const [first, ...rest] = args;
  const hasOptions = isOptions(first);
  const options: GraphOptions = hasOptions ? first : {};
  // Cast justifié : sans options en tête, `first` est bien un membre de graphe ;
  // les deux surcharges publiques ne laissent pas d'autre possibilité.
  const members = (hasOptions ? rest : args) as GraphMember[];

  const slots: Slot[] = [];
  const identified = new Map<string, NodeRecord>();

  for (const raw of flatten(members)) {
    const node = stripContext(resolveIdsDeep(raw, options.baseUrl));
    const id = readId(node);

    if (id === undefined) {
      slots.push({ anonymous: node });
      continue;
    }

    const existing = identified.get(id);
    if (existing === undefined) {
      identified.set(id, node);
      slots.push({ identified: id });
      continue;
    }

    warnInDev(
      `@id dupliqué dans le @graph : "${id}" (${readType(existing) ?? "?"} puis ${
        readType(node) ?? "?"
      }). Les deux nœuds sont fusionnés ; sur une clé commune, le dernier gagne.`,
    );
    identified.set(id, shallowMergeNodes(existing, node));
  }

  const children: NodeRecord[] = slots.map((slot) =>
    "anonymous" in slot ? slot.anonymous : (identified.get(slot.identified) ?? {}),
  );

  if (children.length === 0) {
    throw new TypeError(
      "graph() sans nœud : passer au moins un nœud construit par un builder (localBusiness, website, ...).",
    );
  }

  // Cast justifié : les enfants viennent tous d'un builder, ils portent donc un
  // `@type`. `GraphChild` ne promet rien de plus, et `NodeRecord` ne le sait pas.
  return prune({ "@context": SCHEMA_CONTEXT, "@graph": children as unknown as GraphChild[] });
}
