import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

// Credentials are read lazily rather than at module load, so `next build`
// succeeds on a machine that has no .env.local yet. Anything missing surfaces
// as a readable error on the first request instead of a build crash.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} — copy apps/.env.example to apps/.env.local and fill it in.`
    );
  }
  return value;
}

export function getLamaticClient(): Lamatic {
  return new Lamatic({
    endpoint: required("LAMATIC_API_URL"),
    projectId: required("LAMATIC_PROJECT_ID"),
    apiKey: required("LAMATIC_API_KEY"),
  });
}

/** Flow ID for a step in orchestrate.js, so the env key lives in one place. */
export function flowIdFor(stepKey: keyof typeof config.flows): string {
  const flow = config.flows[stepKey];
  if (!flow) throw new Error(`No flow declared for step "${String(stepKey)}"`);
  if (!flow.workflowId) {
    throw new Error(
      "Missing LAMATIC_API_CHANGE_REVIEW_FLOW_ID — copy apps/.env.example to apps/.env.local and fill it in."
    );
  }
  return flow.workflowId;
}
