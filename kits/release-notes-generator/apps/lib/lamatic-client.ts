import { Lamatic } from "lamatic";

/**
 * Lazily construct the Lamatic client so the app can build and boot even when
 * environment variables are not yet set (e.g. during CI or a first deploy).
 * The check runs when a request actually needs the client, not at import time.
 */
export function getLamaticClient(): Lamatic {
  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Missing Lamatic credentials. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID and LAMATIC_API_KEY in apps/.env.local.",
    );
  }

  return new Lamatic({ endpoint, projectId, apiKey });
}
