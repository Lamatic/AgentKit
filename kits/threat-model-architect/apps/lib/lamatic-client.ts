import { Lamatic } from "lamatic";

const requiredEnv = ["LAMATIC_API_KEY", "LAMATIC_API_URL", "LAMATIC_PROJECT_ID"] as const;

function required(key: (typeof requiredEnv)[number]) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function endpoint() {
  const value = required("LAMATIC_API_URL").replace(/\/+$/, "");
  return value.endsWith("/graphql") ? value : `${value}/graphql`;
}

function requestId(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const id = (value as { requestId?: unknown }).requestId;
  return typeof id === "string" && id ? id : undefined;
}

/**
 * API Response mappings can return literal `$`-prefixed values and serialize
 * arrays/objects as JSON strings. Normalize that Studio behavior before the
 * orchestrator hands one flow's output to the next flow.
 */
function unwrap(value: unknown): unknown {
  if (typeof value === "string") {
    const stripped = value.replace(/^\$/, "");
    if (stripped === "true") return true;
    if (stripped === "false") return false;
    if (stripped.startsWith("{") || stripped.startsWith("[")) {
      try {
        return unwrap(JSON.parse(stripped));
      } catch {
        return stripped;
      }
    }
    return stripped;
  }
  if (Array.isArray(value)) return value.map(unwrap);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, unwrap(entry)]),
    );
  }
  return value;
}

export async function executeFlow<T>(flowEnvKey: string, input: Record<string, unknown>): Promise<T> {
  const flowId = process.env[flowEnvKey];
  if (!flowId) throw new Error(`Missing required environment variable: ${flowEnvKey}`);

  const client = new Lamatic({
    endpoint: endpoint(),
    projectId: required("LAMATIC_PROJECT_ID"),
    apiKey: required("LAMATIC_API_KEY"),
  });
  const initial = await client.executeFlow(flowId, input);
  const id = requestId(initial?.result);
  const execution = id ? await client.checkStatus(id, 2, 120) : initial;

  if (!execution?.status || !["success", "completed"].includes(execution.status.toLowerCase())) {
    throw new Error(`Lamatic workflow failed with status: ${execution?.status ?? "unknown"}`);
  }
  if (!execution.result || typeof execution.result !== "object") {
    throw new Error("Lamatic returned an empty workflow result.");
  }
  return unwrap(execution.result) as T;
}
