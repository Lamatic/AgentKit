import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

// Lazy-init so `next build` doesn't crash when env vars are absent at build time.
let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!client) {
    if (!config.api.endpoint || !config.api.apiKey) {
      throw new Error(
        "Lamatic API credentials are not set. Check your .env.local file."
      );
    }
    client = new Lamatic({
      endpoint: config.api.endpoint,
      projectId: config.api.projectId ?? null,
      apiKey: config.api.apiKey,
    });
  }
  return client;
}
