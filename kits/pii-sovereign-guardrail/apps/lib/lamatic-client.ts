import { Lamatic } from "lamatic";
import config from "../../lamatic.config";

if (!process.env.LAMATIC_API_KEY || !process.env.LAMATIC_PROJECT_ID) {
  console.warn(
    "[pii-sovereign-guardrail] LAMATIC_API_KEY / LAMATIC_PROJECT_ID not set yet."
  );
}

export const guardrailStep = config.steps.find(
  (s) => s.id === "pii-sovereign-guardrail"
);

export const guardrailFlowId = guardrailStep?.envKey
  ? process.env[guardrailStep.envKey]
  : undefined;

/**
 * @deprecated Superseded by callLamaticFlow, which calls Lamatic's
 * GraphQL API directly. Kept only if a future need for the raw SDK
 * client arises.
 */
export function createLamaticClient() {
  return new Lamatic({
    apiKey: process.env.LAMATIC_API_KEY ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    endpoint: process.env.LAMATIC_API_URL ?? ""
  });
}

const EXECUTE_WORKFLOW_QUERY = `
  query ExecuteWorkflow(
    $workflowId: String!
    $rawUserPrompt: String
    $targetModel: String
  ) {
    executeWorkflow(
      workflowId: $workflowId
      payload: {
        rawUserPrompt: $rawUserPrompt
        targetModel: $targetModel
      }
    ) {
      status
      result
    }
  }
`;

/**
 * Executes the deployed pii-sovereign-guardrail flow via Lamatic's
 * GraphQL API directly (bypassing the lamatic npm SDK, which does not
 * reliably construct this platform's expected request shape).
 *
 * @param rawUserPrompt - The raw, unmasked user prompt.
 * @param targetModel - The Groq model identifier to use for this run.
 * @returns The flow's { status, result } response.
 * @throws If the API returns a GraphQL-level error.
 */
export async function callLamaticFlow(rawUserPrompt: string, targetModel: string) {
  const apiKey = process.env.LAMATIC_API_KEY ?? "";
  const projectId = process.env.LAMATIC_PROJECT_ID ?? "";
  const apiUrl = process.env.LAMATIC_API_URL ?? "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": projectId
      },
      body: JSON.stringify({
        query: EXECUTE_WORKFLOW_QUERY,
        variables: {
          workflowId: guardrailFlowId,
          rawUserPrompt,
          targetModel
        }
      }),
      signal: controller.signal
    });

    const json = await res.json();
    if (json.errors) {
      throw new Error(`Lamatic API error: ${JSON.stringify(json.errors)}`);
    }
    return json.data.executeWorkflow;
  } finally {
    clearTimeout(timeout);
  }
}