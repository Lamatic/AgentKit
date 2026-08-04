// lamatic-client.ts — the only place this app talks to Lamatic.
//
// Flow IDs are read through `lamatic.config.ts` rather than by hardcoding env
// var names here, so the kit metadata and the runtime cannot drift apart: if a
// step's `envKey` is renamed in the config, this picks it up automatically and
// the error message names the variable the config actually expects.

import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Thrown when the server is missing configuration.
 *
 * Distinguished from a flow failure because the fix is completely different —
 * this one is the operator's problem, and the UI says so rather than telling
 * the diner their photo was bad.
 */
export class ConfigurationError extends Error {
  public readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Missing server configuration: ${missing.join(", ")}. ` +
        `Copy apps/.env.example to apps/.env.local and fill in the values from Lamatic Studio.`
    );
    this.name = "ConfigurationError";
    this.missing = missing;
  }
}

/** Thrown when a flow runs but does not succeed. */
export class FlowExecutionError extends Error {
  public readonly flowId: string;
  public readonly statusCode?: number;

  constructor(flowId: string, message: string, statusCode?: number) {
    super(message);
    this.name = "FlowExecutionError";
    this.flowId = flowId;
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_ENV_VARS = [
  "LAMATIC_API_URL",
  "LAMATIC_PROJECT_ID",
  "LAMATIC_API_KEY",
] as const;

/** Reads a step's flow-ID env var name from `lamatic.config.ts`. */
export function envKeyForStep(stepId: string): string {
  const step = config.steps.find((candidate) => candidate.id === stepId);
  if (step === undefined) {
    throw new Error(
      `Unknown step "${stepId}". Declared steps: ${config.steps.map((s) => s.id).join(", ")}`
    );
  }
  return step.envKey;
}

/**
 * Resolves everything needed to execute a step, or throws listing what is absent.
 *
 * All missing variables are reported at once — discovering them one restart at a
 * time is a miserable way to set up a project.
 */
export function resolveConfig(stepId: string) {
  const flowIdEnvKey = envKeyForStep(stepId);
  const required = [...API_ENV_VARS, flowIdEnvKey];

  const missing = required.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim() === "";
  });

  if (missing.length > 0) throw new ConfigurationError(missing);

  return {
    endpoint: process.env.LAMATIC_API_URL!.trim(),
    projectId: process.env.LAMATIC_PROJECT_ID!.trim(),
    apiKey: process.env.LAMATIC_API_KEY!.trim(),
    flowId: process.env[flowIdEnvKey]!.trim(),
  };
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

/**
 * Runs a flow declared in `lamatic.config.ts` and returns its raw result.
 *
 * The result is deliberately typed as `unknown`: it came from a language model
 * and has not been validated yet. Callers pass it through the schemas in
 * `scan-schema.ts` before touching it.
 *
 * @param stepId - A step ID from `lamatic.config.ts`, e.g. `"menu-scan"`.
 * @param payload - Fields matching the flow's trigger schema.
 *
 * @throws {ConfigurationError} when env vars are missing.
 * @throws {FlowExecutionError} when the flow returns a non-success status.
 */
export async function executeStep(
  stepId: string,
  payload: Record<string, unknown>
): Promise<unknown> {
  const { endpoint, projectId, apiKey, flowId } = resolveConfig(stepId);

  const client = new Lamatic({ endpoint, projectId, apiKey });

  let response: {
    status?: string;
    result?: unknown;
    message?: string;
    statusCode?: number;
  };

  try {
    response = await client.executeFlow(flowId, payload);
  } catch (cause) {
    // Network-level failure — the flow never ran.
    throw new FlowExecutionError(
      flowId,
      cause instanceof Error ? cause.message : "Could not reach Lamatic."
    );
  }

  if (response?.status !== "success") {
    throw new FlowExecutionError(
      flowId,
      response?.message ?? "The flow did not complete successfully.",
      response?.statusCode
    );
  }

  return response.result;
}

/**
 * Turns an internal error into something safe and useful to show a user.
 *
 * Two rules: never leak an API key, endpoint, or stack trace into the browser;
 * and always leave the reader with an action rather than a status code.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof ConfigurationError) {
    return "This deployment isn't configured yet. Whoever set it up needs to add the Lamatic credentials — see the kit README.";
  }

  if (error instanceof FlowExecutionError) {
    const detail = error.message.toLowerCase();

    if (detail.includes("api key") || detail.includes("unauthor") || error.statusCode === 401) {
      return "Lamatic rejected this project's credentials. Check the API key and project ID.";
    }
    if (detail.includes("not found") || error.statusCode === 404) {
      return "The menu-scan flow could not be found. Check that MENU_SCAN_FLOW_ID matches a deployed flow.";
    }
    if (detail.includes("timeout") || detail.includes("abort")) {
      return "Reading the menu took too long. Try a smaller or clearer photo.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("reach")) {
      return "Could not reach Lamatic. Check your connection and try again.";
    }
    return "The menu could not be read. Try a clearer, straighter photo of the menu.";
  }

  return "Something went wrong reading that menu. Please try again.";
}
