/**
 * Mappeurs de champs partagés entre builders.
 *
 * `localBusiness`, `organization` et `service` décrivent en partie les mêmes
 * choses (adresse, images, références). Les traduire ici évite trois versions
 * légèrement divergentes du même code — et trois façons différentes de se
 * tromper sur `addressCountry`.
 */

import { resolveUrl, toIdRef } from "../internal/url.js";
import { toArray } from "../internal/values.js";
import type {
  AddressInput,
  AggregateRatingInput,
  GeoInput,
  ImageInput,
  OneOrMany,
  PersonInput,
  Ref,
  ReviewInput,
} from "../types/input.js";
import type {
  AggregateRatingNode,
  GeoCoordinatesNode,
  IdRef,
  ImageObjectNode,
  PersonNode,
  PostalAddressNode,
  ReviewNode,
  SchemaContext,
  WithContext,
} from "../types/output.js";

/** Le seul `@context` émis par ce package. */
export const SCHEMA_CONTEXT: SchemaContext = "https://schema.org";

/** Code pays appliqué à une adresse qui n'en précise pas. Ergonomie FR. */
export const DEFAULT_COUNTRY = "FR";

/** Ajoute le `@context` racine. `graph()` le retirera des enfants. */
export function withContext<T extends object>(node: T): WithContext<T> {
  return { "@context": SCHEMA_CONTEXT, ...node };
}

/**
 * Traduit l'adresse ergonomique en `PostalAddress`.
 *
 * `street2` est concaténé à `street` : schema.org n'a pas de champ « complément »
 * (`extendedAddress` existe mais Google ne le lit pas), et Google attend la voie
 * complète sur une seule ligne.
 */
export function buildAddress(
  input: AddressInput | undefined,
  defaultCountry: string,
): PostalAddressNode | undefined {
  if (input === undefined) return undefined;

  const street = [input.street, input.street2].filter((part) => part !== undefined).join(", ");

  // Le pays par défaut ne suffit pas à faire exister une adresse : sans au moins
  // une donnée de localisation, `{"@type":"PostalAddress","addressCountry":"FR"}`
  // n'est que du bruit dans la sortie.
  const hasLocation = [street, input.poBox, input.city, input.region, input.postalCode].some(
    (part) => part !== undefined && part.trim() !== "",
  );
  if (!hasLocation) return undefined;

  return {
    "@type": "PostalAddress",
    streetAddress: street === "" ? undefined : street,
    postOfficeBoxNumber: input.poBox,
    addressLocality: input.city,
    addressRegion: input.region,
    postalCode: input.postalCode,
    addressCountry: input.country ?? defaultCountry,
  };
}

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** Traduit `{ lat, lng }` en `GeoCoordinates`, en refusant les coordonnées absurdes. */
export function buildGeo(input: GeoInput | undefined): GeoCoordinatesNode | undefined {
  if (input === undefined) return undefined;

  if (!Number.isFinite(input.lat) || Math.abs(input.lat) > MAX_LATITUDE) {
    throw new RangeError(
      `Latitude hors bornes : ${input.lat}. Attendu entre -${MAX_LATITUDE} et ${MAX_LATITUDE}.`,
    );
  }
  if (!Number.isFinite(input.lng) || Math.abs(input.lng) > MAX_LONGITUDE) {
    throw new RangeError(
      `Longitude hors bornes : ${input.lng}. Attendu entre -${MAX_LONGITUDE} et ${MAX_LONGITUDE}.`,
    );
  }

  return { "@type": "GeoCoordinates", latitude: input.lat, longitude: input.lng };
}

function buildImage(
  input: string | ImageInput,
  baseUrl: string | undefined,
): string | ImageObjectNode {
  if (typeof input === "string") return resolveUrl(input, baseUrl);

  return {
    "@type": "ImageObject",
    url: resolveUrl(input.url, baseUrl),
    caption: input.caption,
  };
}

/**
 * Normalise les images en tableau. Google recommande de fournir les trois
 * ratios 1:1, 4:3 et 16:9 — d'où le tableau même pour une image unique.
 */
export function buildImages(
  input: OneOrMany<string | ImageInput> | undefined,
  baseUrl: string | undefined,
): (string | ImageObjectNode)[] | undefined {
  const images = toArray(input);
  return images?.map((image) => buildImage(image, baseUrl));
}

/** Le logo reste scalaire : schema.org n'en attend qu'un. */
export function buildLogo(
  input: string | ImageInput | undefined,
  baseUrl: string | undefined,
): string | ImageObjectNode | undefined {
  if (input === undefined) return undefined;
  return buildImage(input, baseUrl);
}

/** Résout un tableau d'URLs contre la base (utile pour `sameAs`, `areaServed` non). */
export function buildUrls(
  input: OneOrMany<string> | undefined,
  baseUrl: string | undefined,
): string[] | undefined {
  return toArray(input)?.map((url) => resolveUrl(url, baseUrl));
}

/** Une chaîne devient une `Person` nommée ; une référence reste une référence. */
export function buildPerson(
  input: string | PersonInput | Ref | undefined,
  baseUrl: string | undefined,
): PersonNode | IdRef | undefined {
  if (input === undefined) return undefined;

  if (typeof input === "string") {
    return { "@type": "Person", name: input };
  }

  if ("@id" in input) {
    return toIdRef(input, baseUrl);
  }

  return {
    "@type": "Person",
    "@id": input.id === undefined ? undefined : resolveUrl(input.id, baseUrl),
    name: input.name,
    url: input.url === undefined ? undefined : resolveUrl(input.url, baseUrl),
    jobTitle: input.jobTitle,
    image: input.image === undefined ? undefined : resolveUrl(input.image, baseUrl),
    sameAs: buildUrls(input.sameAs, baseUrl),
  };
}

/**
 * Traduit la note agrégée. `count` devient `reviewCount` : c'est la propriété
 * que Google lit pour les rich results.
 *
 * ⚠️ Aucun contrôle ici — `validate()` s'en charge, avec l'avertissement sur les
 * avis auto-déclarés (§8.3).
 */
export function buildAggregateRating(
  input: AggregateRatingInput | undefined,
): AggregateRatingNode | undefined {
  if (input === undefined) return undefined;

  return {
    "@type": "AggregateRating",
    ratingValue: input.value,
    reviewCount: input.count,
    bestRating: input.best,
    worstRating: input.worst,
  };
}

/** Traduit un avis. Le nœud est sans `@context` : c'est un enfant. */
export function buildReview(input: ReviewInput, baseUrl: string | undefined): ReviewNode {
  return {
    "@type": "Review",
    "@id": input.id === undefined ? undefined : resolveUrl(input.id, baseUrl),
    author: buildPerson(input.author, baseUrl),
    datePublished: input.datePublished,
    name: input.title,
    reviewBody: input.body,
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.rating,
      bestRating: input.best,
      worstRating: input.worst,
    },
    itemReviewed:
      input.itemReviewed === undefined ? undefined : toIdRef(input.itemReviewed, baseUrl),
  };
}

/** Résout une référence optionnelle vers `{ "@id": … }`. */
export function buildRef(ref: Ref | undefined, baseUrl: string | undefined): IdRef | undefined {
  return ref === undefined ? undefined : toIdRef(ref, baseUrl);
}
