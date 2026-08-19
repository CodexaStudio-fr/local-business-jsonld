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

/** Fragment ajouté à un `@id` qui n'en porte pas (§8.5). */
const ID_FRAGMENT = "business";

/**
 * Construit le nœud `LocalBusiness`.
 *
 * ```ts
 * localBusiness({
 *   type: "Plumber",
 *   name: "Plomberie Dupont",
 *   url: "https://plomberie-dupont.fr",
 *   telephone: "02 43 12 34 56",
 *   address: { street: "12 rue Nationale", city: "Le Mans", postalCode: "72000" },
 *   openingHours: "Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00",
 * });
 * ```
 *
 * La sortie porte son `@context` : elle est utilisable seule dans un `<script>`.
 * Passée à `graph()`, le `@context` sera hissé à la racine du graphe.
 *
 * @throws {InvalidPhoneError} téléphone national sans indicatif exploitable
 * @throws {OpeningHoursError} DSL d'horaires invalide
 * @throws {RangeError} coordonnées géographiques hors bornes
 */
export function localBusiness<T extends AnyLocalBusinessType = "LocalBusiness">(
  input: LocalBusinessInput<T> = {},
  options: BuilderOptions = {},
): WithContext<LocalBusinessNode<T>> {
  const { baseUrl } = options;
  const defaultCountry = options.defaultCountry ?? DEFAULT_COUNTRY;

  // Cast justifié : `T` vaut "LocalBusiness" par défaut, exactement la valeur
  // de repli utilisée ici quand `input.type` est absent.
  const type = (input.type ?? "LocalBusiness") as T;

  const url = input.url === undefined ? undefined : resolveUrl(input.url, baseUrl);

  const id =
    input.id !== undefined
      ? withFragment(resolveUrl(input.id, baseUrl), ID_FRAGMENT)
      : url !== undefined
        ? withFragment(canonicalizeUrl(url), ID_FRAGMENT)
        : undefined;

  const openingHoursSpecification =
    input.openingHours === undefined ? undefined : parseOpeningHours(input.openingHours);

  const specialOpeningHoursSpecification =
    input.specialOpeningHours === undefined
      ? undefined
      : parseSpecialOpeningHours(input.specialOpeningHours);

  const node: LocalBusinessNode<T> = {
    "@type": type,
    "@id": id,
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
    openingHoursSpecification,
    specialOpeningHoursSpecification,
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
