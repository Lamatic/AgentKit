import { Lamatic } from "lamatic";

/** Configured Lamatic SDK client, using credentials from environment variables. */
export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  endpoint: process.env.LAMATIC_API_URL!,
});

/**
 * Returns the deployed flow ID for `impact-review`, read from the
 * `FLOW_IMPACT_REVIEW` environment variable. Throws a clear error if it
 * hasn't been set.
 */
export function getFlowId(): string {
  const flowId = process.env.FLOW_IMPACT_REVIEW;
  if (!flowId) {
    throw new Error(
      "Missing env var FLOW_IMPACT_REVIEW. Copy .env.example to .env.local and paste in your deployed flow's ID from Studio."
    );
  }
  return flowId;
}
