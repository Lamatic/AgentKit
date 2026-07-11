import { Lamatic } from "lamatic";

/** Reads a required environment variable, failing fast with a setup hint if absent. */
function env(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable ${key}. Add it to .env.local (see .env.example).`);
  }
  return value;
}

/** Creates a Lamatic SDK client from LAMATIC_* environment variables. */
export function getLamaticClient() {
  return new Lamatic({
    endpoint: env("LAMATIC_API_URL"),
    projectId: env("LAMATIC_PROJECT_ID"),
    apiKey: env("LAMATIC_API_KEY"),
  });
}

/** Returns the deployed flow IDs for the log and ask flows. */
export function getFlowIds() {
  return {
    log: env("DEVDIARY_LOG_FLOW_ID"),
    ask: env("DEVDIARY_ASK_FLOW_ID"),
  };
}
