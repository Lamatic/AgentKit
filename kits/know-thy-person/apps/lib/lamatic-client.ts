import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

let client: Lamatic | null = null;

/**
 * Lazily construct the Lamatic client. Env vars are read (and validated) only
 * when this is first called at request time, so `next build` never fails at
 * import time when credentials are absent.
 */
export function getLamaticClient(): Lamatic {
  if (client) return client;

  if (!process.env.KNOW_THY_PERSON) {
    throw new Error(
      "Workflow ID env var KNOW_THY_PERSON is not set. Add it to your .env.local file."
    );
  }

  if (
    !process.env.LAMATIC_API_URL ||
    !process.env.LAMATIC_PROJECT_ID ||
    !process.env.LAMATIC_API_KEY
  ) {
    throw new Error(
      "Lamatic API credentials are not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY to your .env.local file."
    );
  }

  client = new Lamatic({
    endpoint: config.api.endpoint ?? "",
    projectId: config.api.projectId ?? null,
    apiKey: config.api.apiKey ?? "",
  });

  return client;
}
