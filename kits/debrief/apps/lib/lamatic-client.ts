import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

function getValidatedEndpoint(): string {
  const raw = config.api.endpoint ?? "";
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") {
      console.warn("LAMATIC_API_URL must use https, got:", url.protocol);
      return "";
    }
    return raw;
  } catch {
    console.warn("LAMATIC_API_URL is not a valid URL:", raw);
    return "";
  }
}

export function hasValidConfig(): boolean {
  return Boolean(
    getValidatedEndpoint() &&
      config.api.projectId &&
      config.api.apiKey &&
      process.env.SUMMARIZE_FEEDBACK
  );
}

export function isLamaticConfigured(): boolean {
  return hasValidConfig();
}

if (!hasValidConfig()) {
  console.warn(
    "Lamatic credentials or SUMMARIZE_FEEDBACK missing/invalid — using local fallback mode for debrief. Endpoint must be https."
  );
}

let client: Lamatic | null = null;

export function getLamaticClient(): Lamatic {
  if (!client) {
    const endpoint = getValidatedEndpoint();
    if (!endpoint || !config.api.projectId || !config.api.apiKey) {
      throw new Error("Lamatic client not configured: missing endpoint/projectId/apiKey");
    }
    client = new Lamatic({
      endpoint,
      projectId: config.api.projectId ?? null,
      apiKey: config.api.apiKey ?? "",
    });
  }
  return client;
}

// Backwards compat for existing imports
export const lamaticClient = {
  executeFlow: async (flowId: string, inputs: Record<string, unknown>) =>
    getLamaticClient().executeFlow(flowId, inputs),
};
