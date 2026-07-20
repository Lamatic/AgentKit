import { Lamatic } from "lamatic";
import { config } from '../orchestrate.js';

if (!process.env.WHY_THIS_CODE) {
  throw new Error("WHY_THIS_CODE flow ID is not set in environment variables.");
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error("Lamatic API Credentials are not set in environment variables.");
}

export const lamaticClient = new Lamatic({
  endpoint: config.api.endpoint ?? "",
  projectId: config.api.projectId ?? null,
  apiKey: config.api.apiKey ?? ""
});
