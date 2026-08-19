import { prune } from "../internal/prune.js";
import { resolveUrl, withFragment } from "../internal/url.js";
import { toArray } from "../internal/values.js";
import type { BuilderOptions, OfferInput, ServiceInput } from "../types/input.js";
import type {
  ItemAvailabilityName,
  ItemAvailabilityUrl,
  OfferNode,
  ServiceNode,
  WithContext,
} from "../types/output.js";
import { buildRef, withContext } from "./shared.js";

const ID_FRAGMENT = "service";
const DEFAULT_CURRENCY = "EUR";
const SCHEMA_PREFIX = "https://schema.org/";

/**
 * `"InStock"` devient `"https://schema.org/InStock"` : `ItemAvailability` est une
 * énumération, dont les membres sont des URIs. Une valeur déjà absolue passe.
 */
function isAvailabilityUrl(
  value: ItemAvailabilityName | ItemAvailabilityUrl,
): value is ItemAvailabilityUrl {
  return value.startsWith(SCHEMA_PREFIX);
}

function buildAvailability(
  value: ItemAvailabilityName | ItemAvailabilityUrl | undefined,
): ItemAvailabilityUrl | undefined {
  if (value === undefined) return undefined;
  return isAvailabilityUrl(value) ? value : `${SCHEMA_PREFIX}${value}`;
}

function buildOffer(input: OfferInput, baseUrl: string | undefined): OfferNode {
  const price = input.price === undefined ? undefined : String(input.price);

  return {
    "@type": "Offer",
    name: input.name,
    description: input.description,
    price,
    // Une devise sans prix ne veut rien dire ; un prix sans devise est ambigu.
    priceCurrency: price === undefined ? undefined : (input.priceCurrency ?? DEFAULT_CURRENCY),
    url: input.url === undefined ? undefined : resolveUrl(input.url, baseUrl),
    availability: buildAvailability(input.availability),
  };
}

/**
 * Construit le nœud `Service` — une prestation rattachée à l'établissement.
 *
 * ```ts
 * service({
 *   id: "#depannage",
 *   name: "Dépannage plomberie 7j/7",
 *   provider: "#business",
 *   areaServed: ["Le Mans", "Sarthe"],
 *   offers: [{ name: "Déplacement", price: 60 }],
 * });
 * ```
 */
export function service<T extends string = "Service">(
  input: ServiceInput = {},
  options: BuilderOptions = {},
): WithContext<ServiceNode<T>> {
  const { baseUrl } = options;

  // Cast justifié : `T` vaut "Service" par défaut, exactement la valeur de repli
  // utilisée quand `input.type` est absent.
  const type = (input.type ?? "Service") as T;

  const node: ServiceNode<T> = {
    "@type": type,
    "@id":
      input.id === undefined ? undefined : withFragment(resolveUrl(input.id, baseUrl), ID_FRAGMENT),
    name: input.name,
    description: input.description,
    serviceType: input.serviceType,
    url: input.url === undefined ? undefined : resolveUrl(input.url, baseUrl),
    provider: buildRef(input.provider, baseUrl),
    areaServed: toArray(input.areaServed),
    offers: input.offers?.map((offer) => buildOffer(offer, baseUrl)),
  };

  return prune(withContext(node));
}
