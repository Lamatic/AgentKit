"use server";

export async function analyzeMeeting(meetingNotes: string, recipientEmail: string) {
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

  const response = await fetch(process.env.LAMATIC_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.LAMATIC_API_KEY}`,
      "x-project-id": process.env.LAMATIC_PROJECT_ID!,
    },
    body: JSON.stringify({
      query,
      variables: {
        workflowId: process.env.LAMATIC_FLOW_ID,
        meetingNotes,
        recipientEmail,
      },
    }),
  });

  const data = await response.json();
  const result = data?.data?.executeWorkflow?.result?.result;
  return result ?? { error: "No result" };
}
