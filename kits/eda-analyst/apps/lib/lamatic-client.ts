import { Lamatic } from "lamatic";

// Lazily construct the Lamatic client so the app still builds/renders without
// credentials (the server action surfaces a friendly error at call time instead
// of crashing `next build`).
let client: Lamatic | null = null;

/**
 * Returns a singleton Lamatic SDK client, constructing it on first use.
 * Reads endpoint, project id, and API key from environment variables.
 * @throws Error if LAMATIC_API_URL, LAMATIC_PROJECT_ID, or LAMATIC_API_KEY is missing.
 */
export function getLamaticClient(): Lamatic {
  if (client) return client;

  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Lamatic credentials. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID and LAMATIC_API_KEY in apps/.env.local.",
    );
  }

  client = new Lamatic({ endpoint, projectId, apiKey });
  return client;
}
