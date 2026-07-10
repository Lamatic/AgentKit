import { Lamatic } from "lamatic";

// Lazily construct the Lamatic client so the app still builds/renders without
// credentials (the action throws a friendly error at call time instead).
let client: any = null;

export function getLamaticClient() {
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
