import lamaticConfig from "../../lamatic.config";

const LAMATIC_API_URL = process.env.LAMATIC_API_URL!;
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!;

// Guards against a slow/hung Lamatic API response blocking the calling
// server action's request thread indefinitely.
const FETCH_TIMEOUT_MS = 30000;


function buildVariableDeclarations(payload: Record<string, unknown>): string {
  return Object.keys(payload)
    .map((key) => `$${key}: String`)
    .join("\n    ");
}

function buildPayloadFields(payload: Record<string, unknown>): string {
  return Object.keys(payload)
    .map((key) => `${key}: $${key}`)
    .join("\n        ");
}

export async function callFlow(stepId: string, payload: Record<string, unknown>) {
  const step = lamaticConfig.steps.find((s: any) => s.id === stepId);
  if (!step) throw new Error(`Unknown flow step: ${stepId}`);

  const flowId = process.env[(step as any).envKey!];
  if (!flowId) throw new Error(`Missing env var ${(step as any).envKey} for flow ${stepId}`);

  const stringPayload: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    stringPayload[key] = typeof value === "string" ? value : JSON.stringify(value);
  }

  const query = `
    query ExecuteWorkflow(
      $workflowId: String!
      ${buildVariableDeclarations(stringPayload)}
    ) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          ${buildPayloadFields(stringPayload)}
        }
      ) {
        status
        result
      }
    }
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(LAMATIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LAMATIC_API_KEY}`,
        "x-project-id": LAMATIC_PROJECT_ID,
      },
      body: JSON.stringify({
        query,
        variables: { workflowId: flowId, ...stringPayload },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Lamatic flow ${stepId} timed out after ${FETCH_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    throw new Error(`Lamatic flow ${stepId} failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(`Lamatic flow ${stepId} returned errors: ${JSON.stringify(json.errors)}`);
  }

  const { status, result } = json.data.executeWorkflow;
  return { status, result };
}