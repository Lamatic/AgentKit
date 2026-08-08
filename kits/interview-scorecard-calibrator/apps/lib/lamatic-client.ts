import { Lamatic } from "lamatic";
import { config } from "../orchestrate.js";

const FLOW_ENV_KEY = "CALIBRATE_SCORECARD_FLOW_ID";

/** Returns the deployed calibrate-scorecard flow ID from app env. */
export function getCalibrateFlowId() {
  const flowId = process.env[FLOW_ENV_KEY];
  if (!flowId) {
    throw new Error(
      `${FLOW_ENV_KEY} is not set. Set it in the application environment (local env file or hosting provider env vars).`,
    );
  }
  return flowId;
}

/** Creates a Lamatic SDK client from app-local environment variables. */
export function getLamaticClient() {
  if (
    !process.env.LAMATIC_API_URL ||
    !process.env.LAMATIC_PROJECT_ID ||
    !process.env.LAMATIC_API_KEY
  ) {
    throw new Error(
      "Lamatic API credentials are not set. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, and LAMATIC_API_KEY in the application environment.",
    );
  }

  return new Lamatic({
    endpoint: config.api.endpoint ?? "",
    projectId: config.api.projectId ?? null,
    apiKey: config.api.apiKey ?? "",
  });
}
