/**
 * Types de sortie : une modélisation **minimale** des nœuds schema.org que ce
 * package produit. Volontairement plus étroite que `schema-dts` (dont les types
 * sont énormes et plombent le `tsc` des consommateurs), mais assignable à
 * `WithContext<LocalBusiness>` — vérifié dans `test/types.test-d.ts`.
 */

import type { AnyLocalBusinessType } from "./business-types.js";

/** Le seul `@context` que ce package émet. */
export type SchemaContext = "https://schema.org";

/** Référence à un autre nœud du graphe. */
export interface IdRef {
  "@id": string;
}

/** Ajoute le `@context` racine à un nœud. */
export type WithContext<T> = T & { "@context": SchemaContext };

/**
 * Retire le `@context` d'un noeud (les enfants d'un `@graph` n'en portent pas).
 * Distributif : appliqué a une union, il conserve l'union.
 */
export type Contextless<T> = T extends unknown ? Omit<T, "@context"> : never;

/** Noms de jours schema.org, forme courte (celle utilisée par la doc Google). */
export type DayOfWeekName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday"
  | "PublicHolidays";

/** Créneau d'ouverture. Heures en `HH:MM`, heure **locale** de l'établissement. */
export interface OpeningHoursSpecificationNode {
  "@type": "OpeningHoursSpecification";
  dayOfWeek?: DayOfWeekName[];
  opens?: string;
  closes?: string;
  validFrom?: string;
  validThrough?: string;
}

export interface PostalAddressNode {
  "@type": "PostalAddress";
  streetAddress?: string;
  postOfficeBoxNumber?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

export interface GeoCoordinatesNode {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
}

/**
 * `width` et `height` sont volontairement absents : schema.org les type en
 * `Distance | QuantitativeValue`, pas en nombre, et Google n'en a pas besoin
 * pour les rich results d'un LocalBusiness. Émettre `"width": 1200` produirait
 * un avertissement du Schema Markup Validator.
 */
export interface ImageObjectNode {
  "@type": "ImageObject";
  url: string;
  contentUrl?: string;
  caption?: string;
}

export interface AggregateRatingNode {
  "@type": "AggregateRating";
  ratingValue: number;
  reviewCount?: number;
  ratingCount?: number;
  bestRating?: number;
  worstRating?: number;
}

export interface RatingNode {
  "@type": "Rating";
  ratingValue: number;
  bestRating?: number;
  worstRating?: number;
}

export interface PersonNode {
  "@type": "Person";
  "@id"?: string;
  name: string;
  url?: string;
  jobTitle?: string;
  image?: string;
  sameAs?: string[];
}

export interface ReviewNode {
  "@type": "Review";
  "@id"?: string;
  author?: PersonNode | IdRef;
  datePublished?: string;
  name?: string;
  reviewBody?: string;
  reviewRating?: RatingNode;
  itemReviewed?: IdRef;
}

export interface OrganizationNode<T extends string = "Organization"> {
  "@type": T;
  "@id"?: string;
  name?: string;
  legalName?: string;
  url?: string;
  logo?: string | ImageObjectNode;
  image?: (string | ImageObjectNode)[];
  description?: string;
  email?: string;
  telephone?: string;
  address?: PostalAddressNode;
  sameAs?: string[];
  vatID?: string;
  taxID?: string;
  founder?: PersonNode | IdRef;
  foundingDate?: string;
  parentOrganization?: IdRef;
}

/**
 * Corps d'un nœud `LocalBusiness` (sans `@context`). Le paramètre `T` porte le
 * `@type` littéral pour que la sortie reste assignable au sous-type précis de
 * `schema-dts` (`Plumber`, `Restaurant`, …).
 */
export interface LocalBusinessNode<T extends string = AnyLocalBusinessType> {
  "@type": T;
  "@id"?: string;
  name?: string;
  legalName?: string;
  alternateName?: string;
  description?: string;
  slogan?: string;
  url?: string;
  telephone?: string;
  faxNumber?: string;
  email?: string;
  priceRange?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string;
  image?: (string | ImageObjectNode)[];
  logo?: string | ImageObjectNode;
  address?: PostalAddressNode;
  geo?: GeoCoordinatesNode;
  hasMap?: string;
  areaServed?: string[];
  knowsLanguage?: string[];
  openingHoursSpecification?: OpeningHoursSpecificationNode[];
  specialOpeningHoursSpecification?: OpeningHoursSpecificationNode[];
  sameAs?: string[];
  aggregateRating?: AggregateRatingNode;
  review?: ReviewNode[];
  founder?: PersonNode | IdRef;
  foundingDate?: string;
  vatID?: string;
  taxID?: string;
  parentOrganization?: IdRef;
}

export interface EntryPointNode {
  "@type": "EntryPoint";
  urlTemplate: string;
}

export interface SearchActionNode {
  "@type": "SearchAction";
  target: EntryPointNode;
  /** Nom de la variable substituée dans `urlTemplate`. */
  "query-input": string;
}

export interface WebSiteNode {
  "@type": "WebSite";
  "@id"?: string;
  url?: string;
  name?: string;
  alternateName?: string;
  description?: string;
  inLanguage?: string;
  publisher?: IdRef;
  potentialAction?: SearchActionNode[];
}

export interface ListItemNode {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbListNode {
  "@type": "BreadcrumbList";
  "@id"?: string;
  itemListElement: ListItemNode[];
}

export interface AnswerNode {
  "@type": "Answer";
  text: string;
}

export interface QuestionNode {
  "@type": "Question";
  name: string;
  acceptedAnswer: AnswerNode;
}

export interface FAQPageNode {
  "@type": "FAQPage";
  "@id"?: string;
  mainEntity: QuestionNode[];
}

/** Membres de l'énumération `ItemAvailability`, forme courte. */
export type ItemAvailabilityName =
  | "BackOrder"
  | "Discontinued"
  | "InStock"
  | "InStoreOnly"
  | "LimitedAvailability"
  | "MadeToOrder"
  | "OnlineOnly"
  | "OutOfStock"
  | "PreOrder"
  | "PreSale"
  | "Reserved"
  | "SoldOut";

/** Membres de l'énumération `ItemAvailability`, forme URI — celle qui est émise. */
export type ItemAvailabilityUrl =
  | "https://schema.org/BackOrder"
  | "https://schema.org/Discontinued"
  | "https://schema.org/InStock"
  | "https://schema.org/InStoreOnly"
  | "https://schema.org/LimitedAvailability"
  | "https://schema.org/MadeToOrder"
  | "https://schema.org/OnlineOnly"
  | "https://schema.org/OutOfStock"
  | "https://schema.org/PreOrder"
  | "https://schema.org/PreSale"
  | "https://schema.org/Reserved"
  | "https://schema.org/SoldOut";

export interface OfferNode {
  "@type": "Offer";
  name?: string;
  description?: string;
  price?: string;
  priceCurrency?: string;
  url?: string;
  availability?: ItemAvailabilityUrl;
}

export interface ServiceNode<T extends string = "Service"> {
  "@type": T;
  "@id"?: string;
  name?: string;
  description?: string;
  serviceType?: string;
  url?: string;
  provider?: IdRef;
  areaServed?: string[];
  offers?: OfferNode[];
}

/** Tout nœud que `graph()` sait composer. */
export type GraphNode =
  | LocalBusinessNode<string>
  | OrganizationNode<string>
  | WebSiteNode
  | BreadcrumbListNode
  | FAQPageNode
  | ServiceNode<string>
  | ReviewNode
  | PersonNode;

/**
 * Enfant d'un `@graph`, vu depuis la sortie.
 *
 * Volontairement large : `graph()` fusionne les noeuds de meme `@id`, ce qui
 * efface les types precis a l'execution. La garantie d'assignabilite a
 * `schema-dts` porte sur chaque builder pris isolement (`test/types.test-d.ts`),
 * pas sur le conteneur. Gardez une reference sur la sortie du builder si vous
 * avez besoin du type exact.
 */
export interface GraphChild {
  "@type": string;
  "@id"?: string;
}

/** Sortie de `graph()` : un seul `@context`, tous les noeuds a plat. */
export interface GraphDocument {
  "@context": SchemaContext;
  "@graph": GraphChild[];
}
