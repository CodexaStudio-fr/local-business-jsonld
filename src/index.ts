/** Générateur JSON-LD schema.org LocalBusiness. Zéro dépendance runtime. */

export { breadcrumbs } from "./builders/breadcrumbs.js";
export { faq } from "./builders/faq.js";
export { type GraphMember, graph } from "./builders/graph.js";
export { localBusiness } from "./builders/local-business.js";
export { organization } from "./builders/organization.js";
export { review } from "./builders/review.js";
export { service } from "./builders/service.js";
export { website } from "./builders/website.js";
export { InvalidPhoneError } from "./internal/phone.js";
export { InvalidUrlError } from "./internal/url.js";
export { DAY_NAMES, dayName } from "./opening-hours/days.js";
export {
  InvalidDateError,
  InvalidDayError,
  InvalidTimeError,
  OpeningHoursError,
} from "./opening-hours/errors.js";
export { parseOpeningHours, parseSpecialOpeningHours } from "./opening-hours/parse.js";
export { type SerializeOptions, serialize } from "./serialize.js";

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
