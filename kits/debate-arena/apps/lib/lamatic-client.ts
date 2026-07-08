import { Lamatic } from "lamatic";

let client: Lamatic | null = null;

/**
 * Lazily constructs (and caches) the Lamatic SDK client from environment
 * variables. Kept lazy so that `next build` never fails just because
 * `.env.local` hasn't been filled in yet -- the error only surfaces when a
 * server action actually tries to call a flow.
 */
export function getLamaticClient(): Lamatic {
  if (client) return client;

  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Lamatic credentials. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in .env.local (see .env.example)."
    );
  }

  client = new Lamatic({ endpoint, projectId, apiKey });
  return client;
}
