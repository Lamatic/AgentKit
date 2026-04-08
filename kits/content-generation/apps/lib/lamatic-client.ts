import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "Lamatic API credentials not set. Please add LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY to your .env.local file."
  );
}

// Validate all flow env vars from lamatic.config.ts steps
for (const step of config.steps) {
  if (step.envKey && !process.env[step.envKey]) {
    throw new Error(
      `Flow ID env var ${step.envKey} is not set. Please add it to your .env.local file.`
    );
  }
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? null,
  apiKey: process.env.LAMATIC_API_KEY ?? ""
});