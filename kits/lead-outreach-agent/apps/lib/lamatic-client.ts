import { Lamatic } from "lamatic";
import { config } from "./config";

if (!config.flows["lead-outreach-agent"].workflowId) {
  throw new Error(
    "LEAD_OUTREACH_AGENT flow ID is not set. Add it to apps/.env.local (see .env.example)."
  );
}

if (!config.api.endpoint || !config.api.projectId || !config.api.apiKey) {
  throw new Error(
    "Lamatic API credentials are not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID and LAMATIC_API_KEY to apps/.env.local."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint,
  projectId: config.api.projectId,
  apiKey: config.api.apiKey,
});
