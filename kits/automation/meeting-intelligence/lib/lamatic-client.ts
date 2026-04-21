export const lamaticConfig = {
  apiUrl: process.env.LAMATIC_API_URL!,
  apiKey: process.env.LAMATIC_API_KEY!,
  projectId: process.env.LAMATIC_PROJECT_ID!,
  flowId: process.env.LAMATIC_FLOW_ID!,
};

export async function executeFlow(payload: Record<string, string>) {
  const query = `
    query ExecuteWorkflow($workflowId: String!, $meetingNotes: String, $recipientEmail: String) {
      executeWorkflow(
        workflowId: $workflowId
        payload: { meetingNotes: $meetingNotes, recipientEmail: $recipientEmail }
      ) {
        status
        result
      }
    }
  `;

  const response = await fetch(lamaticConfig.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${lamaticConfig.apiKey}`,
      "x-project-id": lamaticConfig.projectId,
    },
    body: JSON.stringify({
      query,
      variables: {
        workflowId: lamaticConfig.flowId,
        ...payload,
      },
    }),
  });

  const data = await response.json();
  return data?.data?.executeWorkflow?.result?.result ?? { error: "No result" };
}
