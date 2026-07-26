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
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${required("LAMATIC_API_KEY")}`,
      "x-project-id": required("LAMATIC_PROJECT_ID"),
    },
    body: JSON.stringify({ query, variables: { workflowId: flowId, ...variables } }),
  });
  if (!response.ok) {
    throw new Error(`Lamatic HTTP ${response.status}: ${await response.text()}`);
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
  return unwrap(execution.result) as T;
}
