const requiredEnv = ["LAMATIC_API_KEY", "LAMATIC_API_URL", "LAMATIC_PROJECT_ID"] as const;

function required(key: (typeof requiredEnv)[number]) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function endpoint() {
  return required("LAMATIC_API_URL").replace(/\/+$/, "");
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
  flowEnvKey: string,
  input: Record<string, unknown>,
  options: ExecuteFlowOptions = {},
): Promise<T> {
  const flowId = process.env[flowEnvKey];
  if (!flowId) throw new Error(`Missing required environment variable: ${flowEnvKey}`);
  const configuredTimeout = Number(process.env.LAMATIC_TIMEOUT_MS);
  const timeoutMs =
    options.timeoutMs ??
    (Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 120_000);
  const fetchImpl = options.fetchImpl ?? fetch;
  const names = Object.keys(input);
  const graphQlName = /^[_A-Za-z][_0-9A-Za-z]*$/;
  if (names.some((name) => !graphQlName.test(name))) {
    throw new Error("Flow input contains an invalid GraphQL field name.");
  }
  const variables = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      typeof value === "string" ? value : JSON.stringify(value),
    ]),
  );
  const query = `
    query ExecuteWorkflow($workflowId: String!, ${names.map((name) => `$${name}: String`).join(", ")}) {
      executeWorkflow(workflowId: $workflowId, payload: { ${names.map((name) => `${name}: $${name}`).join(", ")} }) {
        status
        result
      }
    }
  `;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${required("LAMATIC_API_KEY")}`,
        "x-project-id": required("LAMATIC_PROJECT_ID"),
      },
      body: JSON.stringify({ query, variables: { workflowId: flowId, ...variables } }),
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Lamatic workflow timed out after ${timeoutMs}ms.`);
    }
    throw new Error("Lamatic workflow request failed.", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(`Lamatic workflow request failed with HTTP ${response.status}.`);
  }
  const body = (await response.json()) as {
    errors?: Array<{ message: string }>;
    data?: { executeWorkflow?: { status?: string; result?: unknown } };
  };
  if (body.errors?.[0]) {
    throw new Error(`Lamatic GraphQL error: ${body.errors[0].message}`);
  }
  const execution = body.data?.executeWorkflow;
  if (!execution?.status || !["success", "completed"].includes(execution.status.toLowerCase())) {
    throw new Error(`Lamatic workflow failed with status: ${execution?.status ?? "unknown"}`);
  }
  if (!execution.result || typeof execution.result !== "object") {
    throw new Error("Lamatic returned an empty workflow result.");
  }
  return unwrapWorkflowValue(execution.result) as T;
}
