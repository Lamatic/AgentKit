import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

if (!process.env.FOUNDER_LENS_ANALYZE_FLOW_ID || !process.env.FOUNDER_LENS_CHAT_FLOW_ID) {
  throw new Error(
    "Flow IDs not set. Add FOUNDER_LENS_ANALYZE_FLOW_ID and FOUNDER_LENS_CHAT_FLOW_ID to .env.local"
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "Lamatic API credentials not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY to .env.local"
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? "",
});