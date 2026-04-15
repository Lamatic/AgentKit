import { Lamatic } from "lamatic";
import {config} from '../orchestrate.js'

if (!process.env.AGENTIC_QUESTION_FLOW_ID || !process.env.AGENTIC_FEEDBACK_FLOW_ID) {
  console.warn(
    "Warning: AGENTIC_QUESTION_FLOW_ID or AGENTIC_FEEDBACK_FLOW_ID environment variables are not set. Please ensure they are added in your deployment environment."
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  console.warn(
    "Warning: API Credentials environment variables are not set. Please ensure they are added in your deployment environment."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? ""
});