/**
 * Minimal client for Lamatic's GraphQL `executeWorkflow` endpoint.
 * Server-only: reads credentials from environment variables.
 */

type ExecuteResponse<T> = {
  data?: { executeWorkflow?: { status: string; result: T } };
  errors?: Array<{ message: string }>;
};

const GRAPHQL_NAME = /^[_A-Za-z][_0-9A-Za-z]*$/;

function credentials() {
  const endpoint = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;
  if (!endpoint || !projectId || !apiKey) {
    throw new Error(
      "Lamatic credentials missing. Set LAMATIC_API_URL, LAMATIC_PROJECT_ID and LAMATIC_API_KEY in apps/.env.local",
    );
  }
  return { endpoint, projectId, apiKey };
}

export async function executeFlow<TResult = Record<string, unknown>>(
  workflowId: string,
  payload: Record<string, string>,
  timeoutMs = 120_000,
): Promise<TResult> {
  const { endpoint, projectId, apiKey } = credentials();
  const keys = Object.keys(payload);

  // Keys are interpolated into the GraphQL document, so only allow valid identifiers.
  for (const k of keys) {
    if (!GRAPHQL_NAME.test(k)) throw new Error(`Invalid payload key: ${JSON.stringify(k)}`);
  }

  const varDecls = keys.map((k) => `$${k}: String`).join(", ");
  const fields = keys.map((k) => `${k}: $${k}`).join(", ");
  const query = `
    query ExecuteWorkflow($workflowId: String!${varDecls ? ", " + varDecls : ""}) {
      executeWorkflow(workflowId: $workflowId, payload: { ${fields} }) {
        status
        result
      }
    }
  `;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": projectId,
      },
      body: JSON.stringify({ query, variables: { workflowId, ...payload } }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Lamatic HTTP ${res.status}: ${await res.text()}`);

    const json = (await res.json()) as ExecuteResponse<TResult>;
    if (json.errors?.length) throw new Error(`Lamatic error: ${json.errors[0].message}`);

    const result = json.data?.executeWorkflow?.result;
    if (result === undefined || result === null) throw new Error("Lamatic returned no result.");
    return result;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Lamatic's API Response node can return values prefixed with a literal `$`
 * (from the `${{...}}` mapping syntax) and objects/arrays as JSON strings.
 * This undoes both so the UI receives real values.
 */
export function unwrap<T = unknown>(value: unknown): T {
  if (typeof value !== "string") return value as T;
  const s = value.replace(/^\$/, "");
  if (s === "true") return true as T;
  if (s === "false") return false as T;
  if (s.startsWith("{") || s.startsWith("[")) {
    try {
      return JSON.parse(s) as T;
    } catch {
      return s as T;
    }
  }
  return s as T;
}
