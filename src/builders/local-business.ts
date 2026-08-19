import { normalizePhone } from "../internal/phone.js";
import { prune } from "../internal/prune.js";
import { canonicalizeUrl, resolveUrl, withFragment } from "../internal/url.js";
import { joinList, toArray } from "../internal/values.js";
import { parseOpeningHours, parseSpecialOpeningHours } from "../opening-hours/parse.js";
import type { AnyLocalBusinessType } from "../types/business-types.js";
import type { BuilderOptions, LocalBusinessInput } from "../types/input.js";
import type { LocalBusinessNode, WithContext } from "../types/output.js";
import {
  buildAddress,
  buildAggregateRating,
  buildGeo,
  buildImages,
  buildLogo,
  buildPerson,
  buildRef,
  buildReview,
  buildUrls,
  DEFAULT_COUNTRY,
  withContext,
} from "./shared.js";

const ID_FRAGMENT = "business";

function deriveId(
  id: string | undefined,
  url: string | undefined,
  baseUrl: string | undefined,
): string | undefined {
  if (id !== undefined) return withFragment(resolveUrl(id, baseUrl), ID_FRAGMENT);
  if (url !== undefined) return withFragment(canonicalizeUrl(url), ID_FRAGMENT);
  return undefined;
}

/**
 * Construit le nœud `LocalBusiness`, `@context` compris. Passé à `graph()`, le
 * `@context` sera hissé à la racine du graphe.
 */
export function localBusiness<T extends AnyLocalBusinessType = "LocalBusiness">(
  input: LocalBusinessInput<T> = {},
  options: BuilderOptions = {},
): WithContext<LocalBusinessNode<T>> {
  const { baseUrl } = options;
  const defaultCountry = options.defaultCountry ?? DEFAULT_COUNTRY;
  const url = input.url === undefined ? undefined : resolveUrl(input.url, baseUrl);

  const node: LocalBusinessNode<T> = {
    "@type": (input.type ?? "LocalBusiness") as T,
    "@id": deriveId(input.id, url, baseUrl),
    name: input.name,
    legalName: input.legalName,
    alternateName: input.alternateName,
    description: input.description,
    slogan: input.slogan,
    url,
    telephone:
      input.telephone === undefined ? undefined : normalizePhone(input.telephone, defaultCountry),
    faxNumber:
      input.faxNumber === undefined ? undefined : normalizePhone(input.faxNumber, defaultCountry),
    email: input.email,
    priceRange: input.priceRange,
    currenciesAccepted: input.currenciesAccepted,
    paymentAccepted: joinList(input.paymentAccepted),
    image: buildImages(input.image, baseUrl),
    logo: buildLogo(input.logo, baseUrl),
    address: buildAddress(input.address, defaultCountry),
    geo: buildGeo(input.geo),
    hasMap: input.hasMap === undefined ? undefined : resolveUrl(input.hasMap, baseUrl),
    areaServed: toArray(input.areaServed),
    knowsLanguage: toArray(input.knowsLanguage),
    openingHoursSpecification:
      input.openingHours === undefined ? undefined : parseOpeningHours(input.openingHours),
    specialOpeningHoursSpecification:
      input.specialOpeningHours === undefined
        ? undefined
        : parseSpecialOpeningHours(input.specialOpeningHours),
    sameAs: buildUrls(input.sameAs, baseUrl),
    aggregateRating: buildAggregateRating(input.aggregateRating),
    review: input.review?.map((entry) => buildReview(entry, baseUrl)),
    founder: buildPerson(input.founder, baseUrl),
    foundingDate: input.foundingDate,
    vatID: input.vatID,
    taxID: input.taxID,
    parentOrganization: buildRef(input.parentOrganization, baseUrl),
  };

  return prune(withContext(node));
}
