import { Lamatic } from "lamatic";
import { config } from "../orchestrate";

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