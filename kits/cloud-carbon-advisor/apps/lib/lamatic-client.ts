import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

// Credentials are read lazily rather than at module load, so `next build`
// succeeds on a machine with no .env.local yet. Anything missing surfaces as a
// readable error on the first request instead of a build-time crash.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — copy apps/.env.example to apps/.env.local and fill it in.`);
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

export function flowIdFor(stepKey: keyof typeof config.flows): string {
  const flow = config.flows[stepKey];
  if (!flow) throw new Error(`No flow declared for step "${String(stepKey)}"`);
  if (!flow.workflowId) {
    throw new Error("Missing LAMATIC_CARBON_ADVISOR_FLOW_ID.");
  }
  return flow.workflowId;
}

/** True when a flow ID is configured — lets the app fall back gracefully to its
 *  offline heuristic plan when Studio isn't wired up yet. */
export function isFlowConfigured(): boolean {
  return Boolean(config.flows.step1?.workflowId);
}
