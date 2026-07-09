"use server";

const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY!;
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID!;
const LAMATIC_API_URL = process.env.LAMATIC_API_URL!;
const SENTINEL_TRIAGE_FLOW_ID = process.env.SENTINEL_TRIAGE_FLOW_ID!;

async function graphqlRequest(query: string, variables: Record<string, unknown>) {
  const res = await fetch(LAMATIC_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LAMATIC_API_KEY}`,
      "Content-Type": "application/json",
      "x-project-id": LAMATIC_PROJECT_ID
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function executeWorkflow(alertText: string) {
  const query = `
    query ExecuteWorkflow($workflowId: String!, $alert_text: String) {
      executeWorkflow(workflowId: $workflowId, payload: { alert_text: $alert_text }) {
        status
        result
      }
    }
  `;

  const data = await graphqlRequest(query, {
    workflowId: SENTINEL_TRIAGE_FLOW_ID,
    alert_text: alertText
  });

  return data.executeWorkflow.result.requestId;
}

async function checkStatus(requestId: string) {
  const query = `
    query CheckStatus($requestId: String!) {
      checkStatus(requestId: $requestId)
    }
  `;

  const data = await graphqlRequest(query, { requestId });
  return data.checkStatus;
}

export async function triageAlert(alertText: string) {
  const requestId = await executeWorkflow(alertText);

  const maxAttempts = 15;
  const delayMs = 2000;

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const statusResult = await checkStatus(requestId);

    if (statusResult.status === "success") {
      return statusResult.data.output.result;
    }
    if (statusResult.status === "failed" || statusResult.status === "error") {
      throw new Error("Flow execution failed");
    }
  }

  throw new Error("Flow execution timed out");
}