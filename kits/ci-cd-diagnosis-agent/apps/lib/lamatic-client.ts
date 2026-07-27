import { Lamatic } from "lamatic";

const REQUIRED_VARS = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "CICD_DIAGNOSIS_FLOW_ID",
] as const;

export function getLamaticConfig() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `CI/CD Diagnosis Agent is not configured. Missing: ${missing.join(", ")}. ` +
        `Copy apps/.env.example to apps/.env.local and fill in your Lamatic credentials.`
    );
  }

  return {
    endpoint: process.env.LAMATIC_API_URL!,
    projectId: process.env.LAMATIC_PROJECT_ID!,
    apiKey: process.env.LAMATIC_API_KEY!,
    flowId: process.env.CICD_DIAGNOSIS_FLOW_ID!,
  };
}

export function createLamaticClient() {
  const { endpoint, projectId, apiKey } = getLamaticConfig();
  return new Lamatic({ endpoint, projectId, apiKey });
}
