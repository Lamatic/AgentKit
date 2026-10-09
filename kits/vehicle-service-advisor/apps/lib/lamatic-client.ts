import { Lamatic } from "lamatic";

type RequiredEnvironmentKey =
  | "LAMATIC_API_URL"
  | "LAMATIC_PROJECT_ID"
  | "LAMATIC_API_KEY";

function getRequiredEnvironmentValue(key: RequiredEnvironmentKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function createLamaticClient(): Lamatic {
  return new Lamatic({
    endpoint: getRequiredEnvironmentValue("LAMATIC_API_URL"),
    projectId: getRequiredEnvironmentValue("LAMATIC_PROJECT_ID"),
    apiKey: getRequiredEnvironmentValue("LAMATIC_API_KEY"),
  });
}
