import { prune } from "../internal/prune.js";
import { resolveUrl } from "../internal/url.js";
import type { BreadcrumbInput, NodeOptions } from "../types/input.js";
import type { BreadcrumbListNode, ListItemNode, WithContext } from "../types/output.js";
import { withContext } from "./shared.js";

/** Construit le fil d'Ariane. Les positions sont numérotées à partir de 1. */
export function breadcrumbs(
  items: readonly BreadcrumbInput[],
  options: NodeOptions = {},
): WithContext<BreadcrumbListNode> {
  if (items.length === 0) {
    throw new TypeError(
      "Fil d'Ariane vide : schema.org exige au moins une étape dans « itemListElement ».",
    );
  }

  const { baseUrl } = options;

  const itemListElement: ListItemNode[] = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url === undefined ? undefined : resolveUrl(item.url, baseUrl),
  }));

  const node: BreadcrumbListNode = {
    "@type": "BreadcrumbList",
    "@id": options.id === undefined ? undefined : resolveUrl(options.id, baseUrl),
    itemListElement,
  };

  return prune(withContext(node));
}
