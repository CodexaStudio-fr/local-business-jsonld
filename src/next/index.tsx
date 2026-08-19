/**
 * Sous-export `local-business-jsonld/next` : le composant de rendu.
 *
 * Rien ici n'est spécifique à Next — c'est un composant React sans état, qui
 * marche dans n'importe quel rendu serveur. Le chemin d'export garde ce nom
 * parce que c'est là que les gens vont le chercher.
 *
 * **Server component, et ça doit le rester** (§8.10) : pas de `"use client"`,
 * pas de hook, pas d'effet. Le JSON-LD est identique au premier rendu et pour
 * toujours ; le passer côté client ne ferait qu'ajouter un risque
 * d'hydratation pour zéro bénéfice.
 */

import type { ReactElement } from "react";
import { serialize } from "../serialize.js";

export interface JsonLdProps {
  /** Nœud d'un builder, ou document produit par `graph()`. */
  data: object;
  /** `id` de la balise `<script>`, utile pour la déboguer ou la cibler. */
  id?: string;
  /** Nonce CSP, si votre politique interdit les scripts inline non signés. */
  nonce?: string;
  /** Indentation du JSON. Compact par défaut. */
  space?: number | string;
}

/**
 * Injecte le JSON-LD dans un `<script type="application/ld+json">`.
 *
 * ```tsx
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return (
 *     <>
 *       <JsonLd data={jsonLd} />
 *       {children}
 *     </>
 *   );
 * }
 * ```
 *
 * `dangerouslySetInnerHTML` est le seul moyen d'écrire du JSON brut dans un
 * `<script>` : React échapperait un enfant texte en entités HTML, ce qu'aucun
 * parseur JSON-LD ne sait relire. La sûreté vient de `serialize()`, qui rend le
 * contenu inerte avant qu'il arrive ici.
 */
export function JsonLd({ data, id, nonce, space }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      id={id}
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: seul moyen d'écrire du JSON brut dans un <script> ; l'inertie vient de serialize(), voir le JSDoc et test/next.test.tsx
      dangerouslySetInnerHTML={{ __html: serialize(data, { space }) }}
    />
  );
}

export { type SerializeOptions, serialize } from "../serialize.js";
