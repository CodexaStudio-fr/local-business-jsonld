import {
  collectNestedIds,
  graphChildren,
  hasKey,
  isGraphDocument,
  isPlainObject,
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
  message: string;
  nodeId?: string;
  nodeType?: string;
}

export interface ValidationResult {
  /** `true` si aucune erreur. Les avertissements ne bloquent rien. */
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidateOptions {
  /** `"fr"` est le seul catalogue, et la valeur par défaut. */
  locale?: "fr";
  /** `@type` supplémentaires à traiter comme des établissements. */
  businessTypes?: readonly string[];
}

interface Finding {
  code: IssueCode;
  severity: IssueSeverity;
  property: string;
  detail?: string;
}

const SCHEMA_CONTEXT = "https://schema.org";
const E164 = /^\+[1-9]\d{7,14}$/;
const DEFAULT_BEST_RATING = 5;
const DEFAULT_WORST_RATING = 1;

const RECOMMENDED: readonly (readonly [property: string, code: IssueCode])[] = [
  ["image", "missing-image"],
  ["telephone", "missing-telephone"],
  ["url", "missing-url"],
  ["geo", "missing-geo"],
  ["openingHoursSpecification", "missing-opening-hours"],
  ["priceRange", "missing-price-range"],
];

const ADDRESS_PARTS = ["streetAddress", "addressLocality", "postalCode", "addressCountry"];

function error(code: IssueCode, property: string, detail?: string): Finding {
  return { code, severity: "error", property, detail };
}

function warning(code: IssueCode, property: string, detail?: string): Finding {
  return { code, severity: "warning", property, detail };
}

function checkIdentity(node: object): Finding[] {
  const id = readId(node);
  if (id === undefined) return [warning("missing-id", "@id")];
  if (!id.includes("#")) return [warning("id-without-fragment", "@id", id)];
  return [];
}

function checkAddress(node: object): Finding[] {
  const address = readObject(node, "address");
  if (address === undefined) return [error("missing-address", "address")];

  return ADDRESS_PARTS.filter((part) => readString(address, part) === undefined).map((part) =>
    warning("incomplete-address", `address.${part}`, part),
  );
}

function checkRating(node: object): Finding[] {
  const rating = readObject(node, "aggregateRating");
  const hasReviews = readArray(node, "review") !== undefined;
  if (rating === undefined && !hasReviews) return [];

  const findings = [
    warning("self-declared-rating", rating === undefined ? "review" : "aggregateRating"),
  ];
  if (rating === undefined) return findings;

  const value = readNumber(rating, "ratingValue");
  const best = readNumber(rating, "bestRating") ?? DEFAULT_BEST_RATING;
  const worst = readNumber(rating, "worstRating") ?? DEFAULT_WORST_RATING;

  if (value === undefined || value < worst || value > best) {
    findings.push(
      error(
        "rating-out-of-range",
        "aggregateRating.ratingValue",
        `${String(value)} hors de ${worst}–${best}`,
      ),
    );
  }

  const count = readNumber(rating, "reviewCount") ?? readNumber(rating, "ratingCount");
  if (count === undefined || count <= 0) {
    findings.push(error("rating-count-invalid", "aggregateRating.reviewCount", String(count)));
  }

  return findings;
}

function checkOpeningHours(node: object): Finding[] {
  const specs = readArray(node, "openingHoursSpecification") ?? [];
  const closesAtMidnight = specs.some(
    (spec) => isPlainObject(spec) && readString(spec, "closes") === "24:00",
  );

  return closesAtMidnight ? [warning("closes-at-24", "openingHoursSpecification.closes")] : [];
}

function checkBusiness(node: object): Finding[] {
  const findings: Finding[] = [];

  if (readString(node, "name") === undefined) {
    findings.push(error("missing-name", "name"));
  }

  findings.push(...checkAddress(node));

  for (const [property, code] of RECOMMENDED) {
    if (!hasKey(node, property)) findings.push(warning(code, property));
  }

  const telephone = readString(node, "telephone");
  if (telephone !== undefined && !E164.test(telephone)) {
    findings.push(warning("telephone-not-e164", "telephone", telephone));
  }

  findings.push(...checkRating(node), ...checkOpeningHours(node));
  return findings;
}

function checkReferences(node: object, declaredIds: ReadonlySet<string>): Finding[] {
  return [...collectNestedIds(node)]
    .filter((reference) => !declaredIds.has(reference))
    .map((reference) => warning("dangling-reference", "@id", reference));
}

function toIssue(finding: Finding, node: object): ValidationIssue {
  return {
    code: finding.code,
    severity: finding.severity,
    property: finding.property,
    message: MESSAGES_FR[finding.code](finding.detail),
    nodeId: readId(node),
    nodeType: readType(node),
  };
}

/**
 * Contrôle un nœud ou un graphe contre les règles rich results de Google. Les
 * règles `LocalBusiness` ne s'appliquent qu'aux `@type` connus ou annoncés.
 */
export function validate(data: object, options: ValidateOptions = {}): ValidationResult {
  const businessTypes = new Set([...LOCAL_BUSINESS_TYPES, ...(options.businessTypes ?? [])]);
  const isGraph = isGraphDocument(data);
  const nodes = isGraph ? graphChildren(data) : [data];

  const issues: ValidationIssue[] = [];

  if (readString(data, "@context") !== SCHEMA_CONTEXT) {
    issues.push(toIssue(error("missing-context", "@context"), data));
  }

  const declaredIds = new Set(nodes.map(readId).filter((id): id is string => id !== undefined));

  for (const node of nodes) {
    const findings = [
      ...checkIdentity(node),
      ...(businessTypes.has(readType(node) ?? "") ? checkBusiness(node) : []),
      ...(isGraph ? checkReferences(node, declaredIds) : []),
    ];
    issues.push(...findings.map((finding) => toIssue(finding, node)));
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return { valid: errors.length === 0, errors, warnings };
}
