import "server-only";

import { Lamatic } from "lamatic";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Add it to apps/.env.local.`,
    );
  }

  return value;
}

export const lamaticClient = new Lamatic({
  endpoint: getRequiredEnv("LAMATIC_API_URL"),
  projectId: getRequiredEnv("LAMATIC_PROJECT_ID"),
  apiKey: getRequiredEnv("LAMATIC_API_KEY"),
});
