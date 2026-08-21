import { Lamatic } from "lamatic";
import { config } from "../orchestrate";

if (!process.env.TRADE_FINANCE_VALIDATOR_FLOW_ID) {
  throw new Error(
    "TRADE_FINANCE_VALIDATOR_FLOW_ID is not set. Please add it to your .env.local file."
  );
}

if (
  !process.env.LAMATIC_API_URL ||
  !process.env.LAMATIC_PROJECT_ID ||
  !process.env.LAMATIC_API_KEY
) {
  throw new Error(
    "Lamatic API credentials are not set. Please add LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? "",
});
