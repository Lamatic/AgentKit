import "server-only";

import { Lamatic } from "lamatic";
import lamaticConfig from "../../lamatic.config";

const PLACEHOLDER_PREFIXES = [
  "your_",
  "replace_",
  "example_",
  "placeholder",
];

let client: Lamatic | null = null;

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.length === 0 ||
    PLACEHOLDER_PREFIXES.some((prefix) =>
      normalized.startsWith(prefix),
    )
  );
}


function requireEnvironmentVariable(
  name: string,
): string {
  const value = process.env[name]?.trim();

  if (!value || isPlaceholder(value)) {
    throw new Error(
      `Missing required server environment variable: ${name}`,
    );
  }

  return value;
}

function validateEndpoint(endpoint: string): string {
  let parsed: URL;

  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error(
      "LAMATIC_API_URL must be a complete URL copied from Lamatic API Docs.",
    );
  }

  if (
    parsed.protocol !== "https:" &&
    parsed.protocol !== "http:"
  ) {
    throw new Error(
      "LAMATIC_API_URL must use HTTP or HTTPS.",
    );
  }

  return parsed.toString();
}

export function getLamaticClient(): Lamatic {
  if (client) {
    return client;
  }

  const endpoint = validateEndpoint(
    requireEnvironmentVariable(
      "LAMATIC_API_URL",
    ),
  );

  const projectId =
    requireEnvironmentVariable(
      "LAMATIC_PROJECT_ID",
    );

  const apiKey =
    requireEnvironmentVariable(
      "LAMATIC_API_KEY",
    );

  client = new Lamatic({
    endpoint,
    projectId,
    apiKey,
  });

  return client;
}
export function getConfiguredFlowId(
  stepId: string,
): string {
  const step = lamaticConfig.steps.find(
    (candidate) =>
      candidate.id === stepId,
  );

  if (!step) {
    throw new Error(
      `Lamatic step "${stepId}" is not declared in lamatic.config.ts.`,
    );
  }

  if (!step.envKey) {
    throw new Error(
      `Lamatic step "${stepId}" does not declare an envKey.`,
    );
  }

  return requireEnvironmentVariable(
    step.envKey,
  );
}
export async function executeLamaticFlow(
  flowId: string,
  inputs: Record<string, unknown>,
): Promise<unknown> {
  const normalizedFlowId = flowId.trim();

  if (
    !normalizedFlowId ||
    isPlaceholder(normalizedFlowId)
  ) {
    throw new Error(
      "A valid Lamatic flow ID is required.",
    );
  }

  try {
    const lamaticClient = getLamaticClient();

    return await lamaticClient.executeFlow(
      normalizedFlowId,
      inputs,
    );
  } catch (error) {
    console.error(
      "Lamatic flow execution failed:",
      error instanceof Error
        ? error.message
        : "Unknown Lamatic error",
    );

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      if (
        message.includes("unauthorized") ||
        message.includes("authentication") ||
        message.includes("api key") ||
        message.includes("401") ||
        message.includes("403")
      ) {
        throw new Error(
          "Lamatic authentication failed. Check the project ID and API key.",
        );
      }

      if (
        message.includes("fetch failed") ||
        message.includes("network") ||
        message.includes("enotfound")
      ) {
        throw new Error(
          "Could not connect to Lamatic. Check LAMATIC_API_URL and your internet connection.",
        );
      }

      if (
        message.includes("flow") &&
        (
          message.includes("not found") ||
          message.includes("404")
        )
      ) {
        throw new Error(
          "The requested Lamatic flow was not found. Check its deployed flow ID.",
        );
      }
    }

    throw new Error(
      "Lamatic could not complete the flow execution.",
    );
  }
}