import { Lamatic } from "lamatic";

export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  endpoint: process.env.LAMATIC_API_URL!,
});

// This matches the "envKey" for the "pr-flow" step in lamatic.config.ts,
// which matches what Lamatic Studio put in flows/pr-flow's step definition
// when you exported it. If you rename the flow in Studio and re-export,
// double check this still matches.
export function getFlowId(): string {
  const flowId = process.env.FLOW_PR_FLOW;
  if (!flowId) {
    throw new Error(
      "Missing env var FLOW_PR_FLOW. Copy .env.example to .env.local and paste in your deployed flow's ID from Studio."
    );
  }
  return flowId;
}
