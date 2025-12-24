import { Lamatic } from "lamatic";
import { config } from '../orchestrate'

if (!config.api.endpoint || !config.api.projectId || !config.api.apiKey) {
  throw new Error(
    "Lamatic API Credentials are not fully set. Please ensure LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY are configured in your .env file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint,
  projectId: config.api.projectId,
  apiKey: config.api.apiKey
});