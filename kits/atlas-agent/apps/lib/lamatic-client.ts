import { Lamatic } from "lamatic";
import { appConfig, FLOW_ENV_KEYS } from "./app-config";

export function getLamaticClient() {
  const missing = [
    ["LAMATIC_API_URL", appConfig.api.endpoint],
    ["LAMATIC_PROJECT_ID", appConfig.api.projectId],
    ["LAMATIC_API_KEY", appConfig.api.apiKey]
  ].filter(([, value]) => !value).map(([key]) => key);
  const missingFlowIds = Object.values(FLOW_ENV_KEYS).filter((envKey) => !process.env[envKey]);
  missing.push(...missingFlowIds);
  if (missing.length) throw new Error(`Missing Lamatic configuration: ${missing.join(", ")}`);
  return new Lamatic({ endpoint: appConfig.api.endpoint ?? "", projectId: appConfig.api.projectId ?? null, apiKey: appConfig.api.apiKey ?? "" });
}
