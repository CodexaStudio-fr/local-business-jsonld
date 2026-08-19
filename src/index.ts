/**
 * `local-business-jsonld` — générateur JSON-LD schema.org `LocalBusiness`.
 *
 * Zéro dépendance runtime. Ce fichier ne contient que des ré-exports.
 *
 * ```ts
 * import { graph, localBusiness, serialize, website } from "local-business-jsonld";
 * ```
 */

// ── Builders ──────────────────────────────────────────────────────────────────
export { breadcrumbs } from "./builders/breadcrumbs.js";
export { faq } from "./builders/faq.js";
export { type GraphMember, graph } from "./builders/graph.js";
export { localBusiness } from "./builders/local-business.js";
export { organization } from "./builders/organization.js";
export { review } from "./builders/review.js";
export { service } from "./builders/service.js";
export { website } from "./builders/website.js";
// ── Erreurs des entrées ───────────────────────────────────────────────────────
export { InvalidPhoneError } from "./internal/phone.js";
export { InvalidUrlError } from "./internal/url.js";
// ── DSL d'horaires ────────────────────────────────────────────────────────────
export { DAY_NAMES, dayName } from "./opening-hours/days.js";
export {
  InvalidDateError,
  InvalidDayError,
  InvalidTimeError,
  OpeningHoursError,
} from "./opening-hours/errors.js";
export { parseOpeningHours, parseSpecialOpeningHours } from "./opening-hours/parse.js";
// ── Rendu ─────────────────────────────────────────────────────────────────────
export { type SerializeOptions, serialize } from "./serialize.js";

// ── Types d'entrée ────────────────────────────────────────────────────────────
export type {
  AnyLocalBusinessType,
  LocalBusinessType,
} from "./types/business-types.js";
export type {
  AddressInput,
  AggregateRatingInput,
  BreadcrumbInput,
  BuilderOptions,
  FaqInput,
  GeoInput,
  GraphOptions,
  ImageInput,
  LocalBusinessInput,
  NodeOptions,
  OfferInput,
  OneOrMany,
  OrganizationInput,
  PersonInput,
  Ref,
  ReviewInput,
  SearchActionInput,
  ServiceInput,
  SpecialHoursInput,
  WebSiteInput,
} from "./types/input.js";

// ── Types de sortie ───────────────────────────────────────────────────────────
export type {
  AggregateRatingNode,
  AnswerNode,
  BreadcrumbListNode,
  Contextless,
  DayOfWeekName,
  EntryPointNode,
  FAQPageNode,
  GeoCoordinatesNode,
  GraphChild,
  GraphDocument,
  GraphNode,
  IdRef,
  ImageObjectNode,
  ItemAvailabilityName,
  ItemAvailabilityUrl,
  ListItemNode,
  LocalBusinessNode,
  OfferNode,
  OpeningHoursSpecificationNode,
  OrganizationNode,
  PersonNode,
  PostalAddressNode,
  QuestionNode,
  RatingNode,
  ReviewNode,
  SchemaContext,
  SearchActionNode,
  ServiceNode,
  WebSiteNode,
  WithContext,
} from "./types/output.js";
