import { prune } from "../internal/prune.js";
import type { BuilderOptions, ReviewInput } from "../types/input.js";
import type { ReviewNode, WithContext } from "../types/output.js";
import { buildReview, withContext } from "./shared.js";

/**
 * Construit un nœud `Review` autonome. Comme `aggregateRating`, un avis
 * auto-déclaré n'est pas éligible aux rich results Google.
 */
export function review(input: ReviewInput, options: BuilderOptions = {}): WithContext<ReviewNode> {
  return prune(withContext(buildReview(input, options.baseUrl)));
}
