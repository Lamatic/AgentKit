import { Lamatic } from "lamatic";
import { config } from "../orchestrate";

// The Lamatic constructor requires a non-empty endpoint, so we must NOT build it
// at module load in preview mode (no .env.local yet). Construct lazily — only the
// server actions call this, and only when isConfigured() is true.
let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!client) {
    client = new Lamatic({
      endpoint: config.api.endpoint,
      projectId: config.api.projectId,
      apiKey: config.api.apiKey,
    });
  }
  return client;
}
