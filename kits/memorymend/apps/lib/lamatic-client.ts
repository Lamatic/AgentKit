import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

export class ConfigurationError extends Error {
  constructor(missing: string[]) {
    super(`Missing server configuration: ${missing.join(", ")}`);
    this.name = "ConfigurationError";
  }
}

export class FlowExecutionError extends Error {
  constructor(public readonly flowId: string, message: string, public readonly statusCode?: number) {
    super(message);
    this.name = "FlowExecutionError";
  }
}

const API_ENV_VARS = ["LAMATIC_API_URL", "LAMATIC_PROJECT_ID", "LAMATIC_API_KEY"] as const;

export function envKeyForStep(stepId: string): string {
  const step = config.steps.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error(`Unknown step: ${stepId}`);
  return step.envKey;
}

export function resolveConfig(stepId: string) {
  const flowIdEnvKey = envKeyForStep(stepId);
  const required = [...API_ENV_VARS, flowIdEnvKey];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length) throw new ConfigurationError(missing);
  return {
    endpoint: process.env.LAMATIC_API_URL!.trim(),
    projectId: process.env.LAMATIC_PROJECT_ID!.trim(),
    apiKey: process.env.LAMATIC_API_KEY!.trim(),
    flowId: process.env[flowIdEnvKey]!.trim(),
  };
}

export async function executeStep(stepId: string, payload: Record<string, unknown>): Promise<unknown> {
  const { endpoint, projectId, apiKey, flowId } = resolveConfig(stepId);
  const client = new Lamatic({ endpoint, projectId, apiKey });
  try {
    const response = await client.executeFlow(flowId, payload);
    if (response?.status !== "success") {
      throw new FlowExecutionError(flowId, response?.message ?? "Lamatic flow failed.", response?.statusCode);
    }
    return response.result;
  } catch (error) {
    if (error instanceof FlowExecutionError) throw error;
    throw new FlowExecutionError(flowId, error instanceof Error ? error.message : "Could not reach Lamatic.");
  }
}

export function toUserMessage(error: unknown): string {
  if (error instanceof ConfigurationError) return "This deployment is not configured for Lamatic. See the kit README.";
  if (error instanceof FlowExecutionError) {
    if (error.statusCode === 401) return "Lamatic rejected the configured credentials.";
    if (error.statusCode === 404) return "The configured MemoryMend flow was not found.";
    return "The configured MemoryMend flow could not be executed.";
  }
  return "MemoryMend could not complete the configured Lamatic analysis.";
}
