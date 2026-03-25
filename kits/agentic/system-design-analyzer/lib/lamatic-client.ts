import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

if (!process.env.SYSTEM_DESIGN_ANALYZER_FLOW_ID) {
  throw new Error(
    "SYSTEM_DESIGN_ANALYZER_FLOW_ID environment variable is not set. Please add it to your .env.local file."
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "Lamatic API credentials are not fully set. Please ensure LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY are configured in your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? ""
});
