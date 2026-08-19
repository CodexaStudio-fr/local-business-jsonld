import { normalizePhone } from "../internal/phone.js";
import { prune } from "../internal/prune.js";
import { resolveUrl, withFragment } from "../internal/url.js";
import type { BuilderOptions, OrganizationInput } from "../types/input.js";
import type { OrganizationNode, WithContext } from "../types/output.js";
import {
  buildAddress,
  buildImages,
  buildLogo,
  buildPerson,
  buildRef,
  buildUrls,
  DEFAULT_COUNTRY,
  withContext,
} from "./shared.js";

const ID_FRAGMENT = "organization";

/**
 * Construit le nœud `Organization` : maison mère, ou éditeur d'un site. Pour un
 * lieu physique, préférer `localBusiness()`.
 */
export function organization<T extends string = "Organization">(
  input: OrganizationInput = {},
  options: BuilderOptions = {},
): WithContext<OrganizationNode<T>> {
  const { baseUrl } = options;
  const defaultCountry = options.defaultCountry ?? DEFAULT_COUNTRY;

  const node: OrganizationNode<T> = {
    "@type": (input.type ?? "Organization") as T,
    "@id":
      input.id === undefined ? undefined : withFragment(resolveUrl(input.id, baseUrl), ID_FRAGMENT),
    name: input.name,
    legalName: input.legalName,
    url: input.url === undefined ? undefined : resolveUrl(input.url, baseUrl),
    logo: buildLogo(input.logo, baseUrl),
    image: buildImages(input.image, baseUrl),
    description: input.description,
    email: input.email,
    telephone:
      input.telephone === undefined ? undefined : normalizePhone(input.telephone, defaultCountry),
    address: buildAddress(input.address, defaultCountry),
    sameAs: buildUrls(input.sameAs, baseUrl),
    vatID: input.vatID,
    taxID: input.taxID,
    founder: buildPerson(input.founder, baseUrl),
    foundingDate: input.foundingDate,
    parentOrganization: buildRef(input.parentOrganization, baseUrl),
  };

  return prune(withContext(node));
}
