import { Lamatic } from "lamatic";

let client: Lamatic | null = null;

function getClient(): Lamatic {
  if (!client) {
    const endpoint = process.env.LAMATIC_API_URL;
    const projectId = process.env.LAMATIC_PROJECT_ID;
    const apiKey = process.env.LAMATIC_API_KEY;
    if (!endpoint || !apiKey) {
      throw new Error(
        "Lamatic API credentials are not set. Copy apps/.env.example to apps/.env and fill in LAMATIC_API_URL / LAMATIC_PROJECT_ID / LAMATIC_API_KEY."
      );
    }
    client = new Lamatic({ endpoint, projectId: projectId ?? null, apiKey });
  }
  return client;
}

// Lazy-initialized so a missing .env doesn't crash `next build` — only throws when a route
// handler actually tries to call a flow.
export async function runFlow<TOutput = Record<string, unknown>>(
  flowId: string,
  input: Record<string, unknown>
): Promise<TOutput> {
  const result = await getClient().executeFlow(flowId, input);
  if (!result?.result) {
    throw new Error(`Flow ${flowId} returned no result.`);
  }
  return result.result as TOutput;
}
