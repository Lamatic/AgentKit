import { Lamatic } from "lamatic";

// Lazily construct a single Lamatic client. Env vars are validated on first use
// (not at import time) so the build doesn't fail when they're only set at runtime.
let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (client) return client;

  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Lamatic credentials. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in .env.local."
    );
  }

  client = new Lamatic({ endpoint, projectId, apiKey });
  return client;
}
