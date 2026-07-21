import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

if (!process.env.OFFER_NEGOTIATOR) {
  throw new Error(
    "Flow ID not set. Add OFFER_NEGOTIATOR to your .env.local file."
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials not set. Add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId,
  apiKey: config.api.apiKey ?? "",
});
