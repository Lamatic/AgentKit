import { Lamatic } from "lamatic";
import {config} from '../orchestrate.js'

if (!process.env.AGENTIC_REASONING_GENERATE_STEPS || !process.env.AGENTIC_REASONING_SEARCH_WEB || !process.env.AGENTIC_REASONING_DATA_SOURCE || !process.env.AGENTIC_REASONING_FINAL) {
  throw new Error(
    "All Workflow IDs in environment variable are not set. Please add it to your .env.local file."
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
