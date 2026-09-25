import { Lamatic } from "lamatic";
import kit from "../../lamatic.config";
import { assertHttpsEndpoint, pinRedirectPolicy } from "./endpoint";

// Credentials are read lazily rather than at module load, so `next build`
// succeeds on a machine that has no .env.local yet. Anything missing surfaces
// as a readable error on the first request instead of a build crash.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — copy apps/.env.example to apps/.env.local and fill it in.`);
  }
  return value;
}

export function getLamaticClient(): Lamatic {
  const endpoint = assertHttpsEndpoint(required("LAMATIC_API_URL"));
  pinRedirectPolicy(endpoint);
  return new Lamatic({
    endpoint,
    projectId: required("LAMATIC_PROJECT_ID"),
    apiKey: required("LAMATIC_API_KEY"),
  });
}

type StepId = (typeof kit.steps)[number]["id"];

/**
 * Flow ID for a step declared in the kit's lamatic.config.ts. The step's
 * `envKey` names the environment variable that holds the deployed Flow ID, so
 * the app and the kit metadata cannot drift apart.
 */
export function flowIdFor(stepId: StepId): string {
  const step = kit.steps.find((s) => s.id === stepId);
  if (!step) throw new Error(`lamatic.config.ts declares no step "${stepId}".`);
  if (!("envKey" in step) || !step.envKey) {
    throw new Error(`Step "${stepId}" is not run from the app (no envKey in lamatic.config.ts).`);
  }
  return required(step.envKey);
}
