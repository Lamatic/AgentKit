// lamatic-client.ts — GraphQL client for the Lamatic flow execution API
//
// CRITICAL: executeWorkflow is a QUERY, not a MUTATION.
// This is confirmed, tested behavior. Using a mutation type WILL fail.
//
// The API response contains ONLY { status, result, requestId }.
// There is NO latency or token/cost data in the response.
// Latency is measured client-side via performance.now().

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
import config from "../../lamatic.config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** The raw shape returned inside `data.executeWorkflow` by the Lamatic API. */
export interface ExecuteWorkflowApiResult {
  status: string;
  result: Record<string, unknown>;
  requestId?: string;
}

/** What `executeFlow` returns — the API result plus client-measured latency. */
export interface ExecuteFlowResult {
  status: string;
  result: Record<string, unknown>;
  requestId?: string;
  /** Round-trip latency in milliseconds, measured client-side. */
  latencyMs: number;
}

/** The top-level GraphQL response envelope. */
interface GraphQLResponse {
  data?: {
    executeWorkflow?: ExecuteWorkflowApiResult;
  };
  errors?: ReadonlyArray<{ message: string; [key: string]: unknown }>;
}

/** Thrown when a required environment variable is missing or empty. */
export class MissingEnvError extends Error {
  public readonly variableName: string;

  constructor(variableName: string) {
    super(
      `Missing required environment variable: ${variableName}. ` +
        `Set it in your .env file (see .env.example).`
    );
    this.name = "MissingEnvError";
    this.variableName = variableName;
  }
}

/** Thrown when the Lamatic API returns GraphQL-level errors. */
export class GraphQLError extends Error {
  public readonly graphqlErrors: ReadonlyArray<{
    message: string;
    [key: string]: unknown;
  }>;

  constructor(
    errors: ReadonlyArray<{ message: string; [key: string]: unknown }>
  ) {
    const messages = errors.map((e) => e.message).join("; ");
    super(`GraphQL errors: ${messages}`);
    this.name = "GraphQLError";
    this.graphqlErrors = errors;
  }
}

/** Thrown when the HTTP response is not OK (non-2xx). */
export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly responseBody: string;

  constructor(statusCode: number, responseBody: string) {
    super(`Lamatic API returned HTTP ${statusCode}: ${responseBody}`);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads an env var and throws MissingEnvError if it's missing or empty.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new MissingEnvError(name);
  }
  return value.trim();
}

/**
 * Maps a JavaScript runtime value to the closest GraphQL scalar type name.
 *
 * - string  → "String"
 * - number  → integer check → "Int" or "Float"
 * - boolean → "Boolean"
 * - anything else (object, array, null) → "JSON"
 *
 * These type names appear in the generated `query` variable declarations.
 */
function inferGraphQLType(value: unknown): string {
  switch (typeof value) {
    case "string":
      return "String";
    case "number":
      return Number.isInteger(value) ? "Int" : "Float";
    case "boolean":
      return "Boolean";
    default:
      // objects, arrays, null — use the JSON scalar that Lamatic supports
      return "JSON";
  }
}

/**
 * Dynamically builds the GraphQL query string and variables object from a
 * generic payload. This avoids hardcoding `userPrompt` or any other
 * flow-specific field — each key in `payload` becomes a GraphQL variable
 * that is mapped into the `payload: { ... }` argument.
 *
 * Example — if payload is `{ userPrompt: "hello", temperature: 0.5 }`:
 *
 *   query ExecuteWorkflow($workflowId: String!, $userPrompt: String, $temperature: Float) {
 *     executeWorkflow(workflowId: $workflowId, payload: { userPrompt: $userPrompt, temperature: $temperature }) {
 *       status
 *       result
 *       requestId
 *     }
 *   }
 */
function buildQuery(
  flowId: string,
  payload: Record<string, unknown>
): { query: string; variables: Record<string, unknown> } {
  // Always starts with the required workflowId variable
  const varDefs: string[] = ["$workflowId: String!"];
  const payloadFields: string[] = [];
  const variables: Record<string, unknown> = { workflowId: flowId };

  const validIdentifier = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

  for (const [key, value] of Object.entries(payload)) {
    if (!validIdentifier.test(key)) {
      throw new Error(`Invalid payload key: "${key}". Payload keys must be valid GraphQL identifiers (letters, numbers, underscores, and cannot start with a number).`);
    }
    const gqlType = inferGraphQLType(value);
    varDefs.push(`$${key}: ${gqlType}`);
    payloadFields.push(`${key}: $${key}`);
    variables[key] = value;
  }

  const query = [
    `query ExecuteWorkflow(${varDefs.join(", ")}) {`,
    `  executeWorkflow(workflowId: $workflowId, payload: { ${payloadFields.join(", ")} }) {`,
    `    status`,
    `    result`,
    `    requestId`,
    `  }`,
    `}`,
  ].join("\n");

  return { query, variables };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Options for executeFlow. */
export interface ExecuteFlowOptions {
  /** An AbortSignal to cancel the request (e.g. for timeout enforcement). */
  signal?: AbortSignal;
}

/**
 * Execute a Lamatic flow via the GraphQL API and return the result with
 * client-measured latency.
 *
 * @param flowId  - The Lamatic workflow/flow ID to execute.
 * @param payload - Flow-specific input fields (e.g. `{ userPrompt: "..." }`).
 *                  Keys become GraphQL variables mapped into the payload arg.
 * @param options - Optional. Pass `{ signal }` from an AbortController to
 *                  enforce a timeout on the request.
 *
 * @throws {MissingEnvError} if LAMATIC_API_URL, LAMATIC_API_KEY, or
 *         LAMATIC_PROJECT_ID is missing.
 * @throws {HttpError}       if the API returns a non-2xx HTTP status.
 * @throws {GraphQLError}    if the response contains GraphQL-level errors.
 * @throws {Error}           if `data.executeWorkflow` is missing from the
 *                           response (unexpected shape).
 */
export async function executeFlow(
  flowId: string | undefined,
  payload: Record<string, unknown>,
  options?: ExecuteFlowOptions
): Promise<ExecuteFlowResult> {
  // ── 0. Resolve the Flow ID ──
  // FlowBench is designed to test *any* arbitrary flow ID at runtime (e.g. passed from the UI
  // or CLI arguments). However, to conform to the AgentKit "kit" structure, it ships with a
  // demo flow defined in lamatic.config.ts, whose ID is provided via an environment variable
  // specified by config.steps[0].envKey. We use this demo flow ID as a fallback if the user
  // doesn't explicitly provide one.
  const envKey = config.steps[0]?.envKey;
  const demoFlowId = envKey ? process.env[envKey] : undefined;
  
  const resolvedFlowId = flowId || demoFlowId;
  if (!resolvedFlowId) {
    throw new Error(
      "No flow ID provided. You must either specify a flow ID at runtime " +
      `or set the ${envKey || 'demo flow'} environment variable.`
    );
  }

  // ── 1. Validate env vars before making any network request ──
  const apiUrl = requireEnv("LAMATIC_API_URL");
  const apiKey = requireEnv("LAMATIC_API_KEY");
  const projectId = requireEnv("LAMATIC_PROJECT_ID");

  // ── 2. Build the dynamic GraphQL query ──
  const { query, variables } = buildQuery(resolvedFlowId, payload);

  // ── 3. Execute with timing ──
  const startTime = performance.now();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-project-id": projectId,
    },
    body: JSON.stringify({ query, variables }),
    signal: options?.signal,
  });

  const endTime = performance.now();
  const latencyMs = Math.round((endTime - startTime) * 100) / 100; // 2 decimal places

  // ── 4. Handle HTTP errors ──
  if (!response.ok) {
    const body = await response.text().catch(() => "(could not read body)");
    throw new HttpError(response.status, body);
  }

  // ── 5. Parse and validate the GraphQL response ──
  const json: GraphQLResponse = await response.json() as GraphQLResponse;

  if (json.errors && json.errors.length > 0) {
    throw new GraphQLError(json.errors);
  }

  const workflowResult = json.data?.executeWorkflow;
  if (!workflowResult) {
    throw new Error(
      "Unexpected API response: data.executeWorkflow is missing. " +
        `Full response: ${JSON.stringify(json)}`
    );
  }

  // ── 6. Return the result with client-measured latency ──
  return {
    status: workflowResult.status,
    result: workflowResult.result,
    requestId: workflowResult.requestId,
    latencyMs,
  };
}
