/**
 * Types d'entrée : l'API ergonomique. Noms courts, unités évidentes, pas de
 * `@type` à écrire à la main. Tout est optionnel sauf ce qui casserait la sortie.
 */

import type { AnyLocalBusinessType } from "./business-types.js";

/** Référence à un autre nœud : `"#business"`, une URL absolue, ou `{ "@id": … }`. */
export type Ref = string | { "@id": string };

/** Une valeur ou une liste de valeurs. */
export type OneOrMany<T> = T | T[];

export interface AddressInput {
  /** Numéro et rue. → `streetAddress` */
  street?: string;
  /** Complément d'adresse (bâtiment, étage). Concaténé à `street`. */
  street2?: string;
  /** Boîte postale. → `postOfficeBoxNumber` */
  poBox?: string;
  /** Commune. → `addressLocality` */
  city?: string;
  /** Région ou département. → `addressRegion` */
  region?: string;
  /** Code postal. → `postalCode` */
  postalCode?: string;
  /** Code pays ISO 3166-1 alpha-2. Défaut : `"FR"`. → `addressCountry` */
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
  width?: number;
  height?: number;
  caption?: string;
}

/**
 * Horaire exceptionnel : soit un jour unique (`date`), soit une période
 * (`from` / `to`). Dates en `YYYY-MM-DD`.
 */
export interface SpecialHoursInput {
  /** Jour unique. Exclusif avec `from`/`to`. */
  date?: string;
  /** Début de période (inclus). */
  from?: string;
  /** Fin de période (incluse). */
  to?: string;
  /** `true` → fermé sur toute la période. */
  closed?: boolean;
  /** Heure d'ouverture `HH:MM` si ouvert avec des horaires spéciaux. */
  opens?: string;
  /** Heure de fermeture `HH:MM`. */
  closes?: string;
}

export interface AggregateRatingInput {
  /** Note moyenne. */
  value: number;
  /** Nombre d'avis. */
  count: number;
  /** Note maximale de l'échelle. Défaut : `5`. */
  best?: number;
  /** Note minimale de l'échelle. Défaut : `1`. */
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
  /** Auteur de l'avis : nom, objet `PersonInput`, ou référence à un nœud. */
  author: string | PersonInput | Ref;
  /** Note attribuée. */
  rating: number;
  /** Corps de l'avis. */
  body?: string;
  /** Titre de l'avis. */
  title?: string;
  /** Date de publication `YYYY-MM-DD`. */
  datePublished?: string;
  /** Échelle : note maximale. Défaut : `5`. */
  best?: number;
  /** Échelle : note minimale. Défaut : `1`. */
  worst?: number;
  /** Nœud noté (par défaut, laissé au graphe). */
  itemReviewed?: Ref;
  id?: string;
}

/** Options communes aux builders. */
export interface BuilderOptions {
  /** Code pays par défaut de l'adresse. Défaut : `"FR"`. */
  defaultCountry?: string;
  /**
   * Base servant à résoudre les `@id` et URLs relatifs.
   * `graph()` peut aussi la fournir globalement.
   */
  baseUrl?: string;
}

export interface LocalBusinessInput<T extends AnyLocalBusinessType = AnyLocalBusinessType> {
  /** Sous-type schema.org. Défaut : `"LocalBusiness"`. */
  type?: T;
  /**
   * Identifiant du nœud. **Doit porter un fragment** (`#business`) pour être
   * référençable depuis les autres nœuds du graphe.
   */
  id?: string;
  name?: string;
  legalName?: string;
  alternateName?: string;
  description?: string;
  slogan?: string;
  url?: string;
  /** Téléphone au format E.164 (`+33243123456`) ou national avec `defaultCountry`. */
  telephone?: string;
  faxNumber?: string;
  email?: string;
  /** Fourchette de prix, ex. `"€€"` ou `"10-50 €"`. */
  priceRange?: string;
  /** Devise ISO 4217, ex. `"EUR"`. */
  currenciesAccepted?: string;
  /** Moyens de paiement. Une liste est jointe par `", "`. */
  paymentAccepted?: OneOrMany<string>;
  /** Images. Google recommande trois ratios : 1:1, 4:3, 16:9. */
  image?: OneOrMany<string | ImageInput>;
  logo?: string | ImageInput;
  address?: AddressInput;
  geo?: GeoInput;
  /** Lien Google Maps / plan. */
  hasMap?: string;
  /** Zones desservies (communes, départements, régions). */
  areaServed?: OneOrMany<string>;
  /** Langues parlées, codes BCP 47 (`"fr"`, `"en"`). */
  knowsLanguage?: OneOrMany<string>;
  /** DSL d'horaires, ex. `"Mo-Fr 08:00-12:00,14:00-18:00; Sa 09:00-12:00"`. */
  openingHours?: string | string[];
  /** Fermetures et horaires exceptionnels. */
  specialOpeningHours?: SpecialHoursInput[];
  /** Profils externes : réseaux sociaux, fiche Google, annuaires. */
  sameAs?: OneOrMany<string>;
  /**
   * ⚠️ Google ignore — voire pénalise — les avis auto-déclarés affichés par
   * l'entreprise sur sa propre page. Ne renseigner qu'avec une source vérifiable.
   */
  aggregateRating?: AggregateRatingInput;
  /** Avis individuels. Même réserve que `aggregateRating`. */
  review?: ReviewInput[];
  founder?: string | PersonInput | Ref;
  /** Année ou date de création (`"1998"` ou `"1998-04-12"`). */
  foundingDate?: string;
  /** Numéro de TVA intracommunautaire. */
  vatID?: string;
  /** Identifiant fiscal (SIRET, SIREN…). */
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
  /** Gabarit d'URL contenant `{search_term_string}`. */
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
  /** Éditeur du site : référence vers le nœud `LocalBusiness`/`Organization`. */
  publisher?: Ref;
  /** Sitelinks searchbox. Accepte le gabarit d'URL directement. */
  searchAction?: string | SearchActionInput;
}

export interface BreadcrumbInput {
  name: string;
  /** URL de l'étape. Omise sur la dernière étape (page courante). */
  url?: string;
}

export interface FaqInput {
  question: string;
  /** Réponse. Le HTML simple est autorisé par Google. */
  answer: string;
}

export interface OfferInput {
  name?: string;
  description?: string;
  /** Prix, ex. `"90.00"`. */
  price?: string | number;
  /** Devise ISO 4217. Défaut : `"EUR"`. */
  priceCurrency?: string;
  url?: string;
  /** URL schema.org d'`ItemAvailability`, ou nom court (`"InStock"`). */
  availability?: string;
}

export interface ServiceInput {
  /** Sous-type schema.org. Défaut : `"Service"`. */
  type?: string;
  id?: string;
  name?: string;
  description?: string;
  serviceType?: string;
  url?: string;
  /** Prestataire : référence vers le nœud `LocalBusiness`. */
  provider?: Ref;
  areaServed?: OneOrMany<string>;
  offers?: OfferInput[];
}

/** Options de `graph()`. */
export interface GraphOptions {
  /**
   * Base absolue utilisée pour résoudre les `@id` et références relatifs
   * (`"#business"` → `"https://exemple.fr/#business"`).
   */
  baseUrl?: string;
}
