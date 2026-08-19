import type { AnyLocalBusinessType } from "./business-types.js";

/** Le seul `@context` émis. */
export type SchemaContext = "https://schema.org";

/** Référence à un autre nœud du graphe. */
export interface IdRef {
  "@id": string;
}

/** Ajoute le `@context` racine à un nœud. */
export type WithContext<T> = T & { "@context": SchemaContext };

/** Retire le `@context` d'un nœud. Distributif sur une union. */
export type Contextless<T> = T extends unknown ? Omit<T, "@context"> : never;

/** Noms de jours schema.org, forme courte. */
export type DayOfWeekName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday"
  | "PublicHolidays";

/** Créneau d'ouverture. Heures en `HH:MM`, heure locale de l'établissement. */
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

/** Corps d'un nœud `LocalBusiness`, sans `@context`. */
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

/** `ItemAvailability`, forme courte. */
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

/** `ItemAvailability`, forme URI : celle qui est émise. */
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

/** Enfant d'un `@graph`. Large : la fusion efface les types précis. */
export interface GraphChild {
  "@type": string;
  "@id"?: string;
}

/** Sortie de `graph()` : un seul `@context`, tous les nœuds à plat. */
export interface GraphDocument {
  "@context": SchemaContext;
  "@graph": GraphChild[];
}
