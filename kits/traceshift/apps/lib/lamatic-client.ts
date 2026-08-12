import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Add it to apps/.env.local.`);
  return value;
};

export function getTraceShiftClient() {
  const flowEnvKey = config.steps.find((step) => step.id === "traceshift-advisor")?.envKey;
  if (!flowEnvKey) throw new Error("TraceShift advisor flow is not declared in lamatic.config.ts.");
  return {
    flowId: requireEnv(flowEnvKey),
    client: new Lamatic({
      apiKey: requireEnv("LAMATIC_API_KEY"),
      projectId: requireEnv("LAMATIC_PROJECT_ID"),
      endpoint: requireEnv("LAMATIC_API_URL"),
    }),
  };
}
