import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

type StepId = "index-policy" | "analyze-denial" | "draft-appeal";

/**
 * Resolve a deployed flow ID from the env key declared in lamatic.config.ts.
 *
 * @param stepId - A step id from the kit config.
 * @throws If the step has no envKey, or the env var is unset.
 */
export function flowIdFor(stepId: StepId): string {
  const step = config.steps.find((s) => s.id === stepId);
  if (!step?.envKey) {
    throw new Error(`Step "${stepId}" has no envKey in lamatic.config.ts`);
  }
  const id = process.env[step.envKey];
  if (!id) {
    throw new Error(
      `Missing ${step.envKey} in .env.local — copy .env.example and paste the Flow ID from Lamatic Studio.`
    );
  }
  return id;
}

let client: Lamatic | null = null;

export function lamaticClient(): Lamatic {
  if (client) return client;
  const { LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY } = process.env;
  if (!LAMATIC_API_URL || !LAMATIC_PROJECT_ID || !LAMATIC_API_KEY) {
    throw new Error(
      "LAMATIC_API_URL, LAMATIC_PROJECT_ID and LAMATIC_API_KEY must be set in .env.local"
    );
  }
  client = new Lamatic({
    endpoint: LAMATIC_API_URL,
    projectId: LAMATIC_PROJECT_ID,
    apiKey: LAMATIC_API_KEY
  });
  return client;
}

/**
 * Execute a deployed Lamatic flow and return the object its API Response node
 * mapped, unwrapping the SDK's `{ status, result }` envelope.
 *
 * @param stepId - Which kit step to run.
 * @param payload - Trigger payload; must match the flow's input schema.
 * @throws If the flow reports a non-success status or returns no result.
 */
export async function runFlow<T = unknown>(stepId: StepId, payload: Record<string, unknown>): Promise<T> {
  const res: any = await lamaticClient().executeFlow(flowIdFor(stepId), payload);
  if (res?.status && String(res.status).toLowerCase() !== "success") {
    throw new Error(`Flow ${stepId} returned status ${res.status}`);
  }
  if (!res?.result) {
    throw new Error(`Flow ${stepId} returned no result`);
  }
  return res.result as T;
}
