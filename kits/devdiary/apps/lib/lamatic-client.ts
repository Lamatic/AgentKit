import { Lamatic } from "lamatic";
import kitConfig from "../../lamatic.config";

/** Reads a required environment variable, failing fast with a setup hint if absent. */
function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable ${key}. Add it to .env.local (see .env.example).`);
  }
  return value;
}

/** Creates a Lamatic SDK client from LAMATIC_* environment variables. */
export function getLamaticClient() {
  return new Lamatic({
    endpoint: env("LAMATIC_API_URL"),
    projectId: env("LAMATIC_PROJECT_ID"),
    apiKey: env("LAMATIC_API_KEY"),
  });
}

/** Resolves an envKey from the kit's canonical step definitions in lamatic.config.ts. */
function stepEnvKey(stepId: string): string {
  const step = kitConfig.steps.find((s) => s.id === stepId);
  if (!step?.envKey) {
    throw new Error(`Step "${stepId}" with an envKey not found in lamatic.config.ts`);
  }
  return step.envKey;
}

/** Returns the deployed flow IDs for the log and ask flows, keyed via lamatic.config.ts. */
export function getFlowIds() {
  return {
    log: env(stepEnvKey("devdiary-log")),
    ask: env(stepEnvKey("devdiary-ask")),
  };
}
