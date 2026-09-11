import { Lamatic } from "lamatic";
import kitConfig from "../../lamatic.config";

/**
 * The parent kit's step definition for `impact-review`. Per the AgentKit
 * convention (CLAUDE.md), kit Next.js apps import `../../lamatic.config` to
 * read step definitions rather than hard-coding the env-key name.
 */
const STEP = kitConfig.steps.find((s) => s.id === "impact-review");

if (!STEP || !("envKey" in STEP) || !STEP.envKey) {
  throw new Error(
    "lamatic.config.ts has no step with id 'impact-review' and an envKey."
  );
}

/** The env-var name that holds the deployed `impact-review` flow ID. */
const FLOW_ENV_KEY: string = STEP.envKey;

/** Configured Lamatic SDK client, using credentials from environment variables. */
export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  endpoint: process.env.LAMATIC_API_URL!,
});

/**
 * Returns the deployed flow ID for `impact-review`, read from the env var
 * declared by the parent kit's `lamatic.config.ts` step (envKey). Throws a
 * clear error if it hasn't been set.
 */
export function getFlowId(): string {
  const flowId = process.env[FLOW_ENV_KEY];
  if (!flowId) {
    throw new Error(
      `Missing env var ${FLOW_ENV_KEY}. Copy .env.example to .env.local and paste in your deployed flow's ID from Studio.`
    );
  }
  return flowId;
}
