import { Lamatic } from "lamatic";
import kit from "../../lamatic.config";
import type { PlanFacts } from "../lib/plan-parse";
import { validateReviewResult } from "../lib/validate";
import type { ReviewResult } from "../lib/types";
import { endpoint, env } from "./env";

/**
 * One review request, the way the CLI and the eval suite make it: the same
 * flow, the same [string] encoding of facts, the same response validation as
 * the app's server action.
 */
export async function reviewFacts(facts: PlanFacts): Promise<ReviewResult> {
  const step = kit.steps.find((s) => s.id === "tf-plan-review");
  if (!step || !("envKey" in step) || !step.envKey) throw new Error("lamatic.config.ts has no tf-plan-review step with an envKey.");

  const client = new Lamatic({
    endpoint: endpoint(),
    projectId: env("LAMATIC_PROJECT_ID"),
    apiKey: env("LAMATIC_API_KEY"),
  });
  const raw = (await client.executeFlow(env(step.envKey), {
    changes: facts.facts.map((f) => JSON.stringify(f)),
    totalChanges: facts.totalChanges,
    summary: facts.summary,
  })) as { status?: string; message?: string; result?: unknown };
  if (raw?.status === "error" || raw?.message) throw new Error(`Lamatic rejected the request: ${raw.message ?? "unknown error"}`);
  return validateReviewResult(raw?.result ?? raw);
}
