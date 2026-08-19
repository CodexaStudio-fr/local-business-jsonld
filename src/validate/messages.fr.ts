/** Identifiants stables des règles. */
export type IssueCode =
  | "missing-context"
  | "missing-name"
  | "missing-address"
  | "rating-out-of-range"
  | "rating-count-invalid"
  | "missing-image"
  | "missing-telephone"
  | "missing-url"
  | "missing-geo"
  | "missing-opening-hours"
  | "missing-price-range"
  | "incomplete-address"
  | "self-declared-rating"
  | "missing-id"
  | "id-without-fragment"
  | "telephone-not-e164"
  | "closes-at-24"
  | "dangling-reference";

/** Un message prend éventuellement un détail : valeur fautive, propriété visée. */
export type MessageFactory = (detail?: string) => string;

export const MESSAGES_FR: Record<IssueCode, MessageFactory> = {
  "missing-context": () =>
    '`@context` absent ou incorrect : la racine doit porter `"@context": "https://schema.org"`, sinon rien n\'est interprété.',

  "missing-name": () =>
    "`name` est obligatoire pour un LocalBusiness : sans lui, Google n'affiche aucun rich result.",

  "missing-address": () =>
    "`address` est obligatoire pour un LocalBusiness : c'est ce qui rattache la fiche à un lieu réel.",

  "rating-out-of-range": (detail) =>
    `\`aggregateRating.ratingValue\` hors de l'échelle${detail === undefined ? "" : ` (${detail})`} : la note doit rester entre \`worstRating\` et \`bestRating\` (1 à 5 par défaut).`,

  "rating-count-invalid": (detail) =>
    `\`aggregateRating\` sans nombre d'avis exploitable${detail === undefined ? "" : ` (${detail})`} : Google exige un \`reviewCount\` ou \`ratingCount\` strictement positif.`,

  "missing-image": () =>
    "`image` recommandé : Google privilégie trois visuels du même lieu en 1:1, 4:3 et 16:9.",

  "missing-telephone": () =>
    "`telephone` recommandé : c'est le bouton d'appel direct dans les résultats locaux.",

  "missing-url": () =>
    "`url` recommandé : sans elle, Google ne sait pas quelle page canonique associer à l'établissement.",

  "missing-geo": () =>
    "`geo` recommandé : les coordonnées lèvent l'ambiguïté quand plusieurs établissements partagent une même voie.",

  "missing-opening-hours": () =>
    "`openingHoursSpecification` recommandé : c'est ce qui affiche « Ouvert » ou « Ferme à 18:00 » dans les résultats.",

  "missing-price-range": () =>
    "`priceRange` recommandé : quelques symboles suffisent, par exemple `€€`.",

  "incomplete-address": (detail) =>
    `Adresse incomplète : \`${detail ?? "?"}\` manque. Une adresse partielle empêche le rattachement au bon lieu.`,

  "self-declared-rating": () =>
    "Avis auto-déclarés : Google n'accepte pas, pour les rich results, les notes collectées et affichées par l'entreprise sur sa propre page. Sans source vérifiable, le balisage sera ignoré — au mieux.",

  "missing-id": () =>
    "`@id` absent : sans identifiant, ce nœud ne peut être ni référencé ni relié dans un `@graph`.",

  "id-without-fragment": (detail) =>
    `\`@id\` sans fragment${detail === undefined ? "" : ` (${detail})`} : ajouter \`#business\`, \`#website\`… pour distinguer le nœud de la page qui le porte.`,

  "telephone-not-e164": (detail) =>
    `\`telephone\` hors format E.164${detail === undefined ? "" : ` (${detail})`} : écrire \`+33243123456\`, pas \`02 43 12 34 56\`.`,

  "closes-at-24": () =>
    '`closes: "24:00"` : la convention Google pour une fermeture à minuit est `23:59`.',

  "dangling-reference": (detail) =>
    `Référence non résolue vers \`${detail ?? "?"}\` : aucun nœud du \`@graph\` ne porte cet \`@id\`. Volontaire si la cible vit sur une autre page, sinon c'est une faute de frappe.`,
};
