import { Lamatic } from "lamatic";

let clientInstance: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!clientInstance) {
    if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
      throw new Error(
        "Lamatic API credentials are not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
      );
    }
    clientInstance = new Lamatic({
      endpoint: process.env.LAMATIC_API_URL,
      projectId: process.env.LAMATIC_PROJECT_ID,
      apiKey: process.env.LAMATIC_API_KEY,
    });
  }
  return clientInstance;
}

/** True when all four Lamatic env vars are configured — otherwise the app runs in demo mode. */
export function isLamaticConfigured(): boolean {
  return Boolean(
    process.env.LAMATIC_API_URL &&
      process.env.LAMATIC_PROJECT_ID &&
      process.env.LAMATIC_API_KEY &&
      process.env.APPEAL_ANALYSIS_FLOW_ID
  );
}
