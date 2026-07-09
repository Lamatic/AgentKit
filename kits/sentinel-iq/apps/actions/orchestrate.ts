"use server";

const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!;
const LAMATIC_API_URL = process.env.LAMATIC_API_URL!;
const SENTINEL_TRIAGE_FLOW_ID = process.env.SENTINEL_TRIAGE_FLOW_ID!;

async function graphqlRequest(query: string, variables: Record<string, unknown>) {
  const res = await fetch(LAMATIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LAMATIC_API_KEY}`
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function triageAlert(alertText: string) {
  const executeMutation = `
    mutation ExecuteWorkflow($workflowId: String!, $projectId: String!, $payload: JSON!) {
      executeWorkflow(workflowId: $workflowId, projectId: $projectId, payload: $payload) {
        executionId
        status
        output
      }
    }
  `;

  const executeResult = await graphqlRequest(executeMutation, {
    workflowId: SENTINEL_TRIAGE_FLOW_ID,
    projectId: LAMATIC_PROJECT_ID,
    payload: { alert_text: alertText }
  });

  const { executionId, status, output } = executeResult.executeWorkflow;

  if (status === "success" || status === "completed") {
    return output;
  }

  const statusQuery = `
    query ExecutionStatus($executionId: String!) {
      executionStatus(executionId: $executionId) {
        status
        output
      }
    }
  `;

  const maxAttempts = 15;
  const delayMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const pollResult = await graphqlRequest(statusQuery, { executionId });
    const { status: pollStatus, output: pollOutput } = pollResult.executionStatus;

    if (pollStatus === "success" || pollStatus === "completed") {
      return pollOutput;
    }
    if (pollStatus === "failed" || pollStatus === "error") {
      throw new Error("Flow execution failed");
    }
  }

  throw new Error("Flow execution timed out");
}