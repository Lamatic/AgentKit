const endpoint = process.env.LAMATIC_API_URL;
const projectId = process.env.LAMATIC_PROJECT_ID;
const apiKey = process.env.LAMATIC_API_KEY;

if (!endpoint || !projectId || !apiKey) {
  throw new Error(
    "Lamatic credentials missing. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY in apps/.env.local"
  );
}

type ExecuteResponse<T> = {
  data?: { executeWorkflow?: { status: string; result: T } };
  errors?: Array<{ message: string }>;
};

export async function executeFlow<TResult = unknown>(
  workflowId: string,
  payloadShape: Record<string, string>,
  timeoutMs = 180_000
): Promise<TResult> {
  const variableKeys = Object.keys(payloadShape);
  const variableDecls = variableKeys.map((k) => `$${k}: String`).join(", ");
  const payloadFields = variableKeys.map((k) => `${k}: $${k}`).join(", ");

  const query = `
    query ExecuteWorkflow($workflowId: String!, ${variableDecls}) {
      executeWorkflow(workflowId: $workflowId, payload: { ${payloadFields} }) {
        status
        result
      }
    }
  `;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": projectId!,
      },
      body: JSON.stringify({
        query,
        variables: { workflowId, ...payloadShape },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Lamatic HTTP ${res.status}: ${await res.text()}`);
    }

    const json = (await res.json()) as ExecuteResponse<TResult>;

    if (json.errors?.length) {
      throw new Error(`Lamatic GraphQL error: ${json.errors[0].message}`);
    }

    const out = json.data?.executeWorkflow?.result;
    if (out === undefined) {
      throw new Error("Lamatic returned no result");
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lamatic's outputMapping returns every field prefixed with `$` literally
 * (artifact of the `${{...}}` template syntax). And obj/arr fields come back
 * as JSON strings. This helper undoes both quirks.
 */
export function unwrap(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const stripped = value.replace(/^\$/, "");
  if (stripped === "true") return true;
  if (stripped === "false") return false;
  if (stripped.startsWith("{") || stripped.startsWith("[")) {
    try {
      return JSON.parse(stripped);
    } catch {
      return stripped;
    }
  }
  return stripped;
}
