import { prune } from "../internal/prune.js";
import { canonicalizeUrl, resolveUrl, withFragment } from "../internal/url.js";
import type { BuilderOptions, SearchActionInput, WebSiteInput } from "../types/input.js";
import type { SearchActionNode, WebSiteNode, WithContext } from "../types/output.js";
import { buildRef, withContext } from "./shared.js";

const ID_FRAGMENT = "website";
const DEFAULT_QUERY_NAME = "search_term_string";

function buildSearchAction(
  input: string | SearchActionInput,
  baseUrl: string | undefined,
): SearchActionNode {
  const { urlTemplate, queryName = DEFAULT_QUERY_NAME } =
    typeof input === "string" ? { urlTemplate: input } : input;

  const placeholder = `{${queryName}}`;
  if (!urlTemplate.includes(placeholder)) {
    throw new TypeError(
      `Gabarit de recherche invalide : « ${urlTemplate} » ne contient pas « ${placeholder} ». Google a besoin de savoir où injecter la requête.`,
    );
  }

  return {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: resolveUrl(urlTemplate, baseUrl) },
    "query-input": `required name=${queryName}`,
  };
}

/** Construit le nœud `WebSite`, à relier au `LocalBusiness` via `publisher`. */
export function website(
  input: WebSiteInput = {},
  options: BuilderOptions = {},
): WithContext<WebSiteNode> {
  const { baseUrl } = options;
  const url = input.url === undefined ? undefined : resolveUrl(input.url, baseUrl);

  const node: WebSiteNode = {
    "@type": "WebSite",
    "@id":
      input.id !== undefined
        ? withFragment(resolveUrl(input.id, baseUrl), ID_FRAGMENT)
        : url !== undefined
          ? withFragment(canonicalizeUrl(url), ID_FRAGMENT)
          : undefined,
    url,
    name: input.name,
    alternateName: input.alternateName,
    description: input.description,
    inLanguage: input.inLanguage,
    publisher: buildRef(input.publisher, baseUrl),
    potentialAction:
      input.searchAction === undefined
        ? undefined
        : [buildSearchAction(input.searchAction, baseUrl)],
  };

  return prune(withContext(node));
}
