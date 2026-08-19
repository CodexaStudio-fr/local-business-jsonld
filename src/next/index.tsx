import type { ReactElement } from "react";
import { serialize } from "../serialize.js";

export interface JsonLdProps {
  /** Nœud d'un builder, ou document produit par `graph()`. */
  data: object;
  /** `id` de la balise `<script>`. */
  id?: string;
  /** Nonce CSP, si votre politique interdit les scripts inline non signés. */
  nonce?: string;
  /** Indentation du JSON. Compact par défaut. */
  space?: number | string;
}

/**
 * Injecte le JSON-LD dans un `<script type="application/ld+json">`. Server
 * component sans état : aucun hook, aucun risque d'hydratation.
 */
export function JsonLd({ data, id, nonce, space }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      id={id}
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serialize(data, { space }) }}
    />
  );
}

export { type SerializeOptions, serialize } from "../serialize.js";
