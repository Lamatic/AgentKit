import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

/**
 * Shared Lamatic SDK client.
 * Reads credentials from environment variables (see .env.example).
 * Server-side only — never import this into a client component.
 */
export const lamatic = new Lamatic({
  apiKey: process.env.LAMATIC_API_KEY as string,
  projectId: process.env.LAMATIC_PROJECT_ID as string,
  endpoint: process.env.LAMATIC_API_URL as string,
});

/**
 * Resolve a flow's ID from the env key declared in lamatic.config.ts.
 * Keeps flow IDs out of source and in .env.local, per AgentKit convention.
 */
export function getFlowId(stepId: string): string {
  const step = config.steps.find((s: { id: string; envKey?: string }) => s.id === stepId);
  if (!step || !step.envKey) {
    throw new Error(`No envKey declared for step "${stepId}" in lamatic.config.ts`);
  }
  const flowId = process.env[step.envKey];
  if (!flowId) {
    throw new Error(
      `Missing env var ${step.envKey}. Add it to .env.local (see .env.example).`
    );
  }
  return flowId;
}
