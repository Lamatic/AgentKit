import type { AuditRequest, LamaticWorkflowResponse } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to apps/.env.local before running this kit.`);
  }
  return value;
}

function assertNoGraphQLErrors(payload: unknown): void {
  if (!payload || typeof payload !== "object" || !("errors" in payload)) {
    return;
  }

  const errors = (payload as { errors?: Array<{ message?: string }> }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const message = errors.map((error) => error.message || "Unknown GraphQL error").join("; ");
    throw new Error(message);
  }
}

function extractWorkflowResponse(payload: unknown): LamaticWorkflowResponse {
  assertNoGraphQLErrors(payload);

  if (!payload || typeof payload !== "object") {
    throw new Error("Lamatic returned an empty response.");
  }

  const root = payload as Record<string, any>;
  const executeWorkflow = root.data?.executeWorkflow ?? root.executeWorkflow ?? root.result ?? root;

  return {
    status: executeWorkflow?.status,
    result: executeWorkflow?.result ?? executeWorkflow?.output ?? executeWorkflow,
    message: executeWorkflow?.message,
    error: executeWorkflow?.error,
  };
}

export async function executeSmartContractAudit(input: AuditRequest): Promise<LamaticWorkflowResponse> {
  const endpoint = requireEnv("LAMATIC_API_URL");
  const projectId = requireEnv("LAMATIC_PROJECT_ID");
  const apiKey = requireEnv("LAMATIC_API_KEY");
  const workflowId = requireEnv("SMART_CONTRACT_AUDIT_FLOW_ID");

  const query = `
    query ExecuteSmartContractAudit(
      $workflowId: String!
      $contractCode: String!
      $auditMode: String!
      $contractName: String
      $focusAreas: String
    ) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          contractCode: $contractCode
          auditMode: $auditMode
          contractName: $contractName
          focusAreas: $focusAreas
        }
      ) {
        status
        result
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "x-project-id": projectId,
    },
    body: JSON.stringify({
      query,
      variables: {
        workflowId,
        contractCode: input.contractCode,
        auditMode: input.auditMode,
        contractName: input.contractName || "Untitled contract",
        focusAreas: input.focusAreas || "",
      },
    }),
  });

  const text = await response.text();
  let payload: unknown = text;

  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new Error(`Lamatic request failed with status ${response.status}: ${text.slice(0, 240)}`);
  }

  return extractWorkflowResponse(payload);
}
