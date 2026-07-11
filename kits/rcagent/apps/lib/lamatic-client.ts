import { Lamatic } from "lamatic";
import { config } from '../orchestrate.js'

const IS_MOCK = !process.env.LAMATIC_API_KEY || process.env.LAMATIC_API_KEY === "your-lamatic-api-key";

if (!IS_MOCK) {
  if (!process.env.RC_PLANNER_FLOW_ID || !process.env.RC_ANALYZER_FLOW_ID || !process.env.RC_SYNTHESIZER_FLOW_ID) {
    throw new Error(
      "All Workflow IDs in environment variables are not set. Please add it to your .env.local file."
    );
  }

  if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
    throw new Error(
      "Required API credentials (LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY) are missing. Please add them to your .env.local file."
    );
  }
}

export const lamaticClient = IS_MOCK
  ? null as any
  : new Lamatic({
      endpoint: config.api.endpoint ?? "",
      projectId: config.api.projectId ?? null,
      apiKey: config.api.apiKey ?? ""
    });

