import { Lamatic } from "lamatic";
import kitConfig from "../../lamatic.config";

const requiredEnv = ["LAMATIC_API_KEY", "LAMATIC_API_URL", "LAMATIC_PROJECT_ID"] as const;

function required(key: (typeof requiredEnv)[number]) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function getFlowId(stepId: string) {
  const step = kitConfig.steps.find((candidate) => candidate.id === stepId);
  if (!step?.envKey) {
    throw new Error(`No environment binding is configured for flow step: ${stepId}`);
  }
  const flowId = process.env[step.envKey];
  if (!flowId) {
    throw new Error(`Missing required environment variable: ${step.envKey}`);
  }
  return flowId;
}

function createClient() {
  return new Lamatic({
    endpoint: required("LAMATIC_API_URL").replace(/\/+$/, ""),
    projectId: required("LAMATIC_PROJECT_ID"),
    apiKey: required("LAMATIC_API_KEY"),
  });
}

/**
 * API Response mappings can return literal `$`-prefixed values and serialize
 * arrays/objects as JSON strings. Normalize that Studio behavior before the
 * orchestrator hands one flow's output to the next flow.
 */
function parseMappedString(value: string, stripPlainString: boolean): unknown {
  const serialized =
    value.startsWith("${") ||
    value.startsWith("$[") ||
    value === "$true" ||
    value === "$false";
  if (!serialized && !(stripPlainString && value.startsWith("$"))) return value;
  const stripped = value.slice(1);
  if (serialized) {
    if (stripped === "true") return true;
    if (stripped === "false") return false;
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
      try {
        return JSON.parse(stripped);
      } catch {
        return value;
      }
    }
  }
  return stripped;
}

export function unwrapWorkflowValue(value: unknown): unknown {
  if (typeof value === "string") return parseMappedString(value, false);
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        typeof entry === "string" ? parseMappedString(entry, true) : entry,
      ]),
    );
  }
  return value;
}

type ExecuteFlowOptions = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function executeFlow<T>(
  stepId: string,
  input: Record<string, unknown>,
  options: ExecuteFlowOptions = {},
): Promise<T> {
  const configuredTimeout = Number(process.env.LAMATIC_TIMEOUT_MS);
  const timeoutMs =
    options.timeoutMs ??
    (Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 120_000);
  if (options.fetchImpl) {
    throw new Error("Custom fetch implementations are not supported by the Lamatic SDK.");
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const execution = await Promise.race([
      createClient().executeFlow(getFlowId(stepId), input),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`Lamatic workflow timed out after ${timeoutMs}ms.`)),
          timeoutMs,
        );
      }),
    ]);
    if (execution.status !== "success") {
      throw new Error(
        `Lamatic workflow failed${execution.message ? `: ${execution.message}` : "."}`,
      );
    }
    if (!execution.result || typeof execution.result !== "object") {
      throw new Error("Lamatic returned an empty workflow result.");
    }
    return unwrapWorkflowValue(execution.result) as T;
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("Lamatic workflow request failed.", { cause: error });
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
