import { Lamatic } from "lamatic";
import { config } from "../orchestrate";

if (!config.api?.endpoint || !config.api?.projectId || !config.api?.apiKey) {
  throw new Error(
    "Lamatic API credentials are not set. Please check your .env.local file and ensure LAMATIC_PROJECT_ENDPOINT, LAMATIC_PROJECT_ID, and LAMATIC_PROJECT_API_KEY are configured."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? "",
});
