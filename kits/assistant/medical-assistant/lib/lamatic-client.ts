import { Lamatic } from "lamatic";
import {config} from '../orchestrate'

if (!process.env.MEDICAL_ASSISTANT_CHAT) {
  throw new Error(
    "MEDICAL_ASSISTANT_CHAT environment variable is not set. Please add it to your .env.local file."
  );
}

if (!config.api?.endpoint || !config.api?.projectId || !config.api?.apiKey) {
  throw new Error(
    "All API Credentials (endpoint, projectId, apiKey) are not set in config. Please check your configuration."
  );
} 

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? ""
});