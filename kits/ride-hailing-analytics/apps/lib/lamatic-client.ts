import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

const step = config.steps.find((s) => s.id === "ride-hailing-text-to-sql");
const flowIdEnvKey = step?.envKey;

if (!flowIdEnvKey || !process.env[flowIdEnvKey]) {
  throw new Error(
    `${flowIdEnvKey ?? "LAMATIC_FLOW_ID"} environment variable is not set. Please add it to your .env.local file.`
  );
}

if (!process.env.LAMATIC_API_URL || !process.env.LAMATIC_PROJECT_ID || !process.env.LAMATIC_API_KEY) {
  throw new Error(
    "All API Credentials in environment variable are not set. Please add it to your .env.local file."
  );
}

export const lamaticClient = new Lamatic({
  endpoint: process.env.LAMATIC_API_URL ?? "",
  projectId: process.env.LAMATIC_PROJECT_ID ?? null,
  apiKey: process.env.LAMATIC_API_KEY ?? ""
});

export const flowIds = {
  rideHailingTextToSql: process.env[flowIdEnvKey] as string,
};