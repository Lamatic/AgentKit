import config from "../../lamatic.config";

export const lamaticConfig = {
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  apiUrl: process.env.LAMATIC_API_URL!
};

export function getFlowId(stepId: string): string {
  const step = config.steps.find(s => s.id === stepId);
  if (!step || !("envKey" in step)) throw new Error(`No envKey for step ${stepId}`);
  const envKey = step.envKey as string;
  const flowId = process.env[envKey];
  if (!flowId) throw new Error(`Missing env var ${envKey}`);
  return flowId;
}