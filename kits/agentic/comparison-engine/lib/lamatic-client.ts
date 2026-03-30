import { Lamatic } from "lamatic";
import {config} from '../orchestrate.js'

if (!process.env.COMPARISON_RESEARCH_A || !process.env.COMPARISON_RESEARCH_B || !process.env.COMPARISON_ANALYZE || !process.env.COMPARISON_VERDICT) {
  throw new Error(
    "All Comparison Workflow IDs in environment variable are not set. Please add them to your .env file."
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "All API Credentials in environment variable are not set. Please add it to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? ""
});
