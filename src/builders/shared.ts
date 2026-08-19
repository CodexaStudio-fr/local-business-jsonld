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

export const SCHEMA_CONTEXT: SchemaContext = "https://schema.org";
export const DEFAULT_COUNTRY = "FR";

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

/** Ajoute le `@context` racine. `graph()` le retirera des enfants. */
export function withContext<T extends object>(node: T): WithContext<T> {
  return { "@context": SCHEMA_CONTEXT, ...node };
}

export function buildAddress(
  input: AddressInput | undefined,
  defaultCountry: string,
): PostalAddressNode | undefined {
  if (input === undefined) return undefined;

  const street = [input.street, input.street2].filter((part) => part !== undefined).join(", ");
  const parts = [street, input.poBox, input.city, input.region, input.postalCode];

  if (!parts.some((part) => part !== undefined && part.trim() !== "")) return undefined;

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

export function buildImages(
  input: OneOrMany<string | ImageInput> | undefined,
  baseUrl: string | undefined,
): (string | ImageObjectNode)[] | undefined {
  return toArray(input)?.map((image) => buildImage(image, baseUrl));
}

export function buildLogo(
  input: string | ImageInput | undefined,
  baseUrl: string | undefined,
): string | ImageObjectNode | undefined {
  return input === undefined ? undefined : buildImage(input, baseUrl);
}

export function buildUrls(
  input: OneOrMany<string> | undefined,
  baseUrl: string | undefined,
): string[] | undefined {
  return toArray(input)?.map((url) => resolveUrl(url, baseUrl));
}

export function buildPerson(
  input: string | PersonInput | Ref | undefined,
  baseUrl: string | undefined,
): PersonNode | IdRef | undefined {
  if (input === undefined) return undefined;
  if (typeof input === "string") return { "@type": "Person", name: input };
  if ("@id" in input) return toIdRef(input, baseUrl);

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
    itemReviewed: buildRef(input.itemReviewed, baseUrl),
  };
}

export function buildRef(ref: Ref | undefined, baseUrl: string | undefined): IdRef | undefined {
  return ref === undefined ? undefined : toIdRef(ref, baseUrl);
}
