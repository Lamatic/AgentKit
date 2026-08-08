import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

if (!process.env.LAMATIC_API_KEY || !process.env.LAMATIC_PROJECT_ID) {
  // Don't throw at import time — Next.js may import this during build
  // before env vars are available. orchestrate.ts checks again at call time.
  console.warn(
    "[pii-sovereign-guardrail] LAMATIC_API_KEY / LAMATIC_PROJECT_ID not set yet."
  );
}

// Lazily construct the client — only called once we actually have a
// deployed flow to hit. This avoids the Lamatic SDK's own validation
// (e.g. "Endpoint URL is required") firing during local demo mode,
// when no endpoint is configured yet.
export function createLamaticClient() {
  return new Lamatic({
    apiKey: process.env.LAMATIC_API_KEY ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    endpoint: process.env.LAMATIC_API_URL ?? ""
  });
}

export const guardrailStep = config.steps.find(
  (s) => s.id === "pii-guardrail"
);

export const guardrailFlowId = guardrailStep?.envKey
  ? process.env[guardrailStep.envKey]
  : undefined;