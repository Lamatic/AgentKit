import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

// Lazy-init to avoid crashes during `next build` when env vars aren't set.
let _client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!_client) {
    if (!config.api.endpoint || !config.api.apiKey) {
      throw new Error(
        "Lamatic API credentials are not set. Check your .env.local file."
      );
    }
    _client = new Lamatic({
      endpoint: config.api.endpoint,
      projectId: config.api.projectId ?? null,
      apiKey: config.api.apiKey,
    });
  }
  return _client;
}

// Keep backward-compat export (but only use getLamaticClient() in new code)
export const lamaticClient = {
  executeFlow: (workflowId: string, inputs: any) =>
    getLamaticClient().executeFlow(workflowId, inputs),
};
