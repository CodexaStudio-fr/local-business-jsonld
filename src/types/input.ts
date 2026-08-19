import type { AnyLocalBusinessType } from "./business-types.js";
import type { ItemAvailabilityName, ItemAvailabilityUrl } from "./output.js";

/** Référence à un autre nœud : `"#business"`, une URL absolue, ou `{ "@id": … }`. */
export type Ref = string | { "@id": string };

/** Une valeur, ou une liste de valeurs. */
export type OneOrMany<T> = T | readonly T[];

export interface AddressInput {
  /** Numéro et rue. */
  street?: string;
  /** Complément d'adresse. Concaténé à `street`. */
  street2?: string;
  /** Boîte postale. */
  poBox?: string;
  /** Commune. */
  city?: string;
  /** Région ou département. */
  region?: string;
  postalCode?: string;
  /** Code pays ISO 3166-1 alpha-2. Défaut : `"FR"`. */
  country?: string;
}

export interface GeoInput {
  /** Latitude décimale. */
  lat: number;
  /** Longitude décimale. */
  lng: number;
}

export interface ImageInput {
  url: string;
  caption?: string;
}

/** Un jour unique (`date`), ou une période (`from`/`to`). Dates en `YYYY-MM-DD`. */
export interface SpecialHoursInput {
  date?: string;
  from?: string;
  to?: string;
  /** Fermé sur toute la période. Exclut `opens`/`closes`. */
  closed?: boolean;
  /** Heure d'ouverture `HH:MM`. */
  opens?: string;
  /** Heure de fermeture `HH:MM`. */
  closes?: string;
}

export interface AggregateRatingInput {
  /** Note moyenne. */
  value: number;
  /** Nombre d'avis. */
  count: number;
  /** Haut de l'échelle. Défaut : `5`. */
  best?: number;
  /** Bas de l'échelle. Défaut : `1`. */
  worst?: number;
}

export interface PersonInput {
  name: string;
  url?: string;
  jobTitle?: string;
  image?: string;
  sameAs?: OneOrMany<string>;
  id?: string;
}

export interface ReviewInput {
  /** Nom de l'auteur, objet `PersonInput`, ou référence à un nœud. */
  author: string | PersonInput | Ref;
  rating: number;
  /** Corps de l'avis. */
  body?: string;
  /** Titre de l'avis. */
  title?: string;
  /** Date de publication `YYYY-MM-DD`. */
  datePublished?: string;
  best?: number;
  worst?: number;
  /** Nœud noté. */
  itemReviewed?: Ref;
  id?: string;
}

export interface BuilderOptions {
  /** Code pays appliqué à une adresse qui n'en précise pas. Défaut : `"FR"`. */
  defaultCountry?: string;
  /** Base servant à résoudre les `@id` et URLs relatifs. */
  baseUrl?: string;
}

/** Options des builders dont l'`@id` n'est pas déduit d'une URL. */
export interface NodeOptions extends BuilderOptions {
  id?: string;
}

export interface LocalBusinessInput<T extends AnyLocalBusinessType = AnyLocalBusinessType> {
  /** Sous-type schema.org. Défaut : `"LocalBusiness"`. */
  type?: T;
  /** Identifiant du nœud. Le fragment `#business` est ajouté s'il manque. */
  id?: string;
  name?: string;
  legalName?: string;
  alternateName?: string;
  description?: string;
  slogan?: string;
  url?: string;
  /** E.164 (`+33243123456`), ou format national avec `defaultCountry`. */
  telephone?: string;
  faxNumber?: string;
  email?: string;
  /** Fourchette de prix, ex. `"€€"`. */
  priceRange?: string;
  /** Devise ISO 4217, ex. `"EUR"`. */
  currenciesAccepted?: string;
  /** Moyens de paiement. Une liste est jointe par `", "`. */
  paymentAccepted?: OneOrMany<string>;
  /** Google recommande trois ratios : 1:1, 4:3, 16:9. */
  image?: OneOrMany<string | ImageInput>;
  logo?: string | ImageInput;
  address?: AddressInput;
  geo?: GeoInput;
  /** Lien Google Maps ou plan. */
  hasMap?: string;
  /** Zones desservies : communes, départements, régions. */
  areaServed?: OneOrMany<string>;
  /** Langues parlées, codes BCP 47. */
  knowsLanguage?: OneOrMany<string>;
  /** DSL d'horaires, ex. `"Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00"`. */
  openingHours?: string | readonly string[];
  /** Fermetures et horaires exceptionnels. */
  specialOpeningHours?: readonly SpecialHoursInput[];
  /** Réseaux sociaux, fiche Google, annuaires. */
  sameAs?: OneOrMany<string>;
  /** Sans source vérifiable, Google ignore les avis auto-déclarés. */
  aggregateRating?: AggregateRatingInput;
  /** Même réserve que `aggregateRating`. */
  review?: readonly ReviewInput[];
  founder?: string | PersonInput | Ref;
  /** Année ou date de création. */
  foundingDate?: string;
  /** TVA intracommunautaire. */
  vatID?: string;
  /** Identifiant fiscal, SIRET ou SIREN. */
  taxID?: string;
  /** Maison mère, pour les réseaux multi-établissements. */
  parentOrganization?: Ref;
}

export interface OrganizationInput {
  /** Sous-type schema.org. Défaut : `"Organization"`. */
  type?: string;
  id?: string;
  name?: string;
  legalName?: string;
  url?: string;
  logo?: string | ImageInput;
  image?: OneOrMany<string | ImageInput>;
  description?: string;
  email?: string;
  telephone?: string;
  address?: AddressInput;
  sameAs?: OneOrMany<string>;
  vatID?: string;
  taxID?: string;
  founder?: string | PersonInput | Ref;
  foundingDate?: string;
  parentOrganization?: Ref;
}

export interface SearchActionInput {
  /** Gabarit d'URL contenant la variable de requête. */
  urlTemplate: string;
  /** Nom de la variable. Défaut : `"search_term_string"`. */
  queryName?: string;
}

export interface WebSiteInput {
  id?: string;
  url?: string;
  name?: string;
  alternateName?: string;
  description?: string;
  /** Code BCP 47, ex. `"fr-FR"`. */
  inLanguage?: string;
  /** Référence vers le nœud `LocalBusiness` ou `Organization`. */
  publisher?: Ref;
  /** Sitelinks searchbox. Le gabarit d'URL suffit. */
  searchAction?: string | SearchActionInput;
}

export interface BreadcrumbInput {
  name: string;
  /** Omise sur la dernière étape, la page courante. */
  url?: string;
}

export interface FaqInput {
  question: string;
  /** Le HTML simple est autorisé par Google. */
  answer: string;
}

export interface OfferInput {
  name?: string;
  description?: string;
  price?: string | number;
  /** Devise ISO 4217. Défaut : `"EUR"`. */
  priceCurrency?: string;
  url?: string;
  /** Nom court (`"InStock"`) ou URI schema.org complète. */
  availability?: ItemAvailabilityName | ItemAvailabilityUrl;
}

export interface ServiceInput {
  /** Sous-type schema.org. Défaut : `"Service"`. */
  type?: string;
  id?: string;
  name?: string;
  description?: string;
  serviceType?: string;
  url?: string;
  /** Référence vers le nœud du prestataire. */
  provider?: Ref;
  areaServed?: OneOrMany<string>;
  offers?: readonly OfferInput[];
}

export interface GraphOptions {
  /** Base absolue pour résoudre les `@id` et URLs relatifs. */
  baseUrl?: string;
}
