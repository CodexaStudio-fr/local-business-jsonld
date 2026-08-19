import { prune } from "../internal/prune.js";
import { resolveUrl } from "../internal/url.js";
import type { FaqInput, NodeOptions } from "../types/input.js";
import type { FAQPageNode, QuestionNode, WithContext } from "../types/output.js";
import { withContext } from "./shared.js";

/** Construit la `FAQPage`. Une seule par page. */
export function faq(
  items: readonly FaqInput[],
  options: NodeOptions = {},
): WithContext<FAQPageNode> {
  if (items.length === 0) {
    throw new TypeError("FAQ vide : schema.org exige au moins une question dans « mainEntity ».");
  }

  const mainEntity: QuestionNode[] = items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  }));

  const node: FAQPageNode = {
    "@type": "FAQPage",
    "@id": options.id === undefined ? undefined : resolveUrl(options.id, options.baseUrl),
    mainEntity,
  };

  return prune(withContext(node));
}
