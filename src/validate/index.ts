/**
 * Sous-export `local-business-jsonld/validate` : contrôle runtime d'un nœud ou
 * d'un graphe contre les règles *rich results* de Google.
 *
 * Deux niveaux, et la distinction compte :
 *
 * - **`errors`** — Google n'affichera pas de rich result. `name` et `address`
 *   sont obligatoires pour un `LocalBusiness`, point final.
 * - **`warnings`** — recommandé, ou piège connu. Le balisage reste valide, mais
 *   il performera moins bien, ou finira ignoré.
 *
 * Le validateur ne remplace pas le Rich Results Test de Google ni le Schema
 * Markup Validator : il attrape en CI ce qu'on ne veut pas découvrir en
 * production.
 */

import {
  collectNestedIds,
  graphChildren,
  hasKey,
  isGraphDocument,
  readArray,
  readId,
  readNumber,
  readObject,
  readString,
  readType,
} from "../internal/nodes.js";
import { LOCAL_BUSINESS_TYPES } from "../types/business-types.js";
import { type IssueCode, MESSAGES_FR } from "./messages.fr.js";

export type { IssueCode } from "./messages.fr.js";

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  /** Identifiant stable de la règle, sûr à filtrer. */
  code: IssueCode;
  severity: IssueSeverity;
  /** Chemin de la propriété visée, ex. `address.postalCode`. */
  property: string;
  /** Message lisible, en français. */
  message: string;
  /** `@id` du nœud concerné, quand il en a un. */
  nodeId?: string;
  /** `@type` du nœud concerné. */
  nodeType?: string;
}

export interface ValidationResult {
  /** `true` si aucune erreur — les avertissements ne bloquent rien. */
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidateOptions {
  /**
   * Langue des messages. `"fr"` est le seul catalogue à ce jour, et c'est la
   * valeur par défaut.
   */
  locale?: "fr";
  /**
   * `@type` supplémentaires à traiter comme des établissements. Nécessaire pour
   * les types passés par l'échappatoire, que l'union curée ne connaît pas.
   */
  businessTypes?: readonly string[];
}

const SCHEMA_CONTEXT = "https://schema.org";
/** E.164 : un `+`, un indicatif qui ne commence pas par 0, 8 à 15 chiffres. */
const E164 = /^\+[1-9]\d{7,14}$/;

/** Propriétés recommandées par Google pour un `LocalBusiness`. */
const RECOMMENDED: readonly (readonly [property: string, code: IssueCode])[] = [
  ["image", "missing-image"],
  ["telephone", "missing-telephone"],
  ["url", "missing-url"],
  ["geo", "missing-geo"],
  ["openingHoursSpecification", "missing-opening-hours"],
  ["priceRange", "missing-price-range"],
];

/** Composantes d'adresse dont l'absence dégrade le rattachement au lieu. */
const ADDRESS_PARTS = ["streetAddress", "addressLocality", "postalCode", "addressCountry"];

class IssueCollector {
  private readonly issues: ValidationIssue[] = [];
  private nodeId: string | undefined;
  private nodeType: string | undefined;

  focus(node: object): void {
    this.nodeId = readId(node);
    this.nodeType = readType(node);
  }

  add(severity: IssueSeverity, code: IssueCode, property: string, detail?: string): void {
    this.issues.push({
      code,
      severity,
      property,
      message: MESSAGES_FR[code](detail),
      nodeId: this.nodeId,
      nodeType: this.nodeType,
    });
  }

  error(code: IssueCode, property: string, detail?: string): void {
    this.add("error", code, property, detail);
  }

  warn(code: IssueCode, property: string, detail?: string): void {
    this.add("warning", code, property, detail);
  }

  result(): ValidationResult {
    const errors = this.issues.filter((issue) => issue.severity === "error");
    const warnings = this.issues.filter((issue) => issue.severity === "warning");
    return { valid: errors.length === 0, errors, warnings };
  }
}

/** Contrôles applicables à n'importe quel nœud : identité et liaison. */
function checkIdentity(node: object, collector: IssueCollector): void {
  const id = readId(node);
  if (id === undefined) {
    collector.warn("missing-id", "@id");
  } else if (!id.includes("#")) {
    collector.warn("id-without-fragment", "@id", id);
  }
}

function checkAddress(node: object, collector: IssueCollector): void {
  const address = readObject(node, "address");
  if (address === undefined) {
    collector.error("missing-address", "address");
    return;
  }
  for (const part of ADDRESS_PARTS) {
    if (readString(address, part) === undefined) {
      collector.warn("incomplete-address", `address.${part}`, part);
    }
  }
}

function checkRating(node: object, collector: IssueCollector): void {
  const rating = readObject(node, "aggregateRating");
  const hasReviews = readArray(node, "review") !== undefined;

  if (rating === undefined && !hasReviews) return;

  // Toujours, même quand tout est bien formé : c'est une règle éditoriale de
  // Google, pas une erreur de balisage (§8.3).
  collector.warn("self-declared-rating", rating === undefined ? "review" : "aggregateRating");

  if (rating === undefined) return;

  const value = readNumber(rating, "ratingValue");
  const best = readNumber(rating, "bestRating") ?? 5;
  const worst = readNumber(rating, "worstRating") ?? 1;

  if (value === undefined || value < worst || value > best) {
    collector.error(
      "rating-out-of-range",
      "aggregateRating.ratingValue",
      `${String(value)} hors de ${worst}–${best}`,
    );
  }

  const count = readNumber(rating, "reviewCount") ?? readNumber(rating, "ratingCount");
  if (count === undefined || count <= 0) {
    collector.error("rating-count-invalid", "aggregateRating.reviewCount", String(count));
  }
}

function checkOpeningHours(node: object, collector: IssueCollector): void {
  for (const entry of readArray(node, "openingHoursSpecification") ?? []) {
    if (typeof entry !== "object" || entry === null) continue;
    if (readString(entry, "closes") === "24:00") {
      collector.warn("closes-at-24", "openingHoursSpecification.closes");
      return;
    }
  }
}

/** Règles propres au `LocalBusiness` : obligatoires, recommandées, pièges. */
function checkBusiness(node: object, collector: IssueCollector): void {
  if (readString(node, "name") === undefined) {
    collector.error("missing-name", "name");
  }

  checkAddress(node, collector);

  for (const [property, code] of RECOMMENDED) {
    if (!hasKey(node, property)) collector.warn(code, property);
  }

  const telephone = readString(node, "telephone");
  if (telephone !== undefined && !E164.test(telephone)) {
    collector.warn("telephone-not-e164", "telephone", telephone);
  }

  checkRating(node, collector);
  checkOpeningHours(node, collector);
}

/**
 * Contrôle un nœud ou un graphe.
 *
 * ```ts
 * const { valid, errors, warnings } = validate(jsonLd);
 * if (!valid) throw new Error(errors.map((issue) => issue.message).join("\n"));
 * ```
 *
 * Les règles `LocalBusiness` s'appliquent aux nœuds dont le `@type` appartient à
 * l'union curée ; les autres ne reçoivent que les contrôles d'identité. Pour un
 * `@type` passé par l'échappatoire, l'annoncer via `businessTypes`.
 */
export function validate(data: object, options: ValidateOptions = {}): ValidationResult {
  const collector = new IssueCollector();
  const businessTypes = new Set<string>([
    ...LOCAL_BUSINESS_TYPES,
    ...(options.businessTypes ?? []),
  ]);

  const isGraph = isGraphDocument(data);
  const nodes = isGraph ? graphChildren(data) : [data];

  collector.focus(data);
  if (readString(data, "@context") !== SCHEMA_CONTEXT) {
    collector.error("missing-context", "@context");
  }

  const declaredIds = new Set<string>();
  for (const node of nodes) {
    const id = readId(node);
    if (id !== undefined) declaredIds.add(id);
  }

  for (const node of nodes) {
    collector.focus(node);
    checkIdentity(node, collector);

    if (businessTypes.has(readType(node) ?? "")) {
      checkBusiness(node, collector);
    }

    // Une référence pendante n'a de sens qu'à l'échelle d'un graphe : un nœud
    // seul ne peut évidemment pas contenir ses propres cibles.
    if (!isGraph) continue;
    for (const reference of collectNestedIds(node)) {
      if (!declaredIds.has(reference)) {
        collector.warn("dangling-reference", "@id", reference);
      }
    }
  }

  return collector.result();
}
