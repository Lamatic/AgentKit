import { Lamatic } from "lamatic";

const required = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
  "ACCESSIBILITY_AUDIT_FLOW_ID",
] as const;

export function getLamaticConfig() {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(`Missing server configuration: ${missing.join(", ")}`);
  }

  return {
    endpoint: process.env.LAMATIC_API_URL!,
    projectId: process.env.LAMATIC_PROJECT_ID!,
    apiKey: process.env.LAMATIC_API_KEY!,
    flowId: process.env.ACCESSIBILITY_AUDIT_FLOW_ID!,
  };
}

export function createLamaticClient() {
  const config = getLamaticConfig();
  return {
    client: new Lamatic({
      endpoint: config.endpoint,
      projectId: config.projectId,
      apiKey: config.apiKey,
    }),
    flowId: config.flowId,
  };
}
