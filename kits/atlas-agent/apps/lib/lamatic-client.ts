import { Lamatic } from "lamatic";
import { config } from "../orchestrate";
import kitConfig from "../../lamatic.config";

export function getLamaticClient() {
  const missing = [
    ["LAMATIC_API_URL", config.api.endpoint],
    ["LAMATIC_PROJECT_ID", config.api.projectId],
    ["LAMATIC_API_KEY", config.api.apiKey]
  ].filter(([, value]) => !value).map(([key]) => key);
  const missingFlowIds = kitConfig.steps.filter((step) => !process.env[step.envKey]).map((step) => step.envKey);
  missing.push(...missingFlowIds);
  if (missing.length) throw new Error(`Missing Lamatic configuration: ${missing.join(", ")}`);
  return new Lamatic({ endpoint: config.api.endpoint ?? "", projectId: config.api.projectId ?? null, apiKey: config.api.apiKey ?? "" });
}
