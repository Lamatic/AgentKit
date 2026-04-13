
type LamaticResponse = {
  data?: {
    executeWorkflow?: {
      status?: string;
      result?: any;
    };
  };
  errors?: { message: string }[];
};



export async function runLamaticWorkflow({
  workflowId,
  payload,
}: {
  workflowId: string;
  payload: Record<string, any>;
}) {
  const apiUrl = process.env.LAMATIC_API_URL;
  const apiKey = process.env.LAMATIC_API_KEY;
  const projectId = process.env.LAMATIC_PROJECT_ID;

  if (!apiUrl || !apiKey || !projectId || !workflowId) {
    throw new Error("Missing Lamatic environment variables");
  }

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-project-id": projectId,
    },
    body: JSON.stringify({
      query: `
        query Execute($workflowId: String!, $payload: JSON!) {
          executeWorkflow(
            workflowId: $workflowId
            payload: $payload
          ) {
            status
            result
          }
        }
      `,
      variables: {
        workflowId,
        payload,
      },
    }),
    cache: "no-store",
  });

  const rawText = await res.text();

  if (!rawText || !rawText.trim()) {
    throw new Error("Lamatic returned an empty response");
  }

  let data: LamaticResponse;

  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Lamatic returned invalid JSON: ${rawText}`);
  }

  if (!res.ok) {
    throw new Error(
      data?.errors?.[0]?.message || `Lamatic request failed: ${res.status}`
    );
  }

  if (data?.errors?.length) {
    throw new Error(data.errors[0].message || "Lamatic GraphQL error");
  }

  return data?.data?.executeWorkflow?.result;
}


export async function runTravelAgent(input: {
  destination: string;
  days: number;
  budget: number;
  destination_type: string;
}) {
  const workflowId = process.env.GLOBAL_TRAVEL_AGENT;

  if (!workflowId) {
    throw new Error("Missing GLOBAL_TRAVEL_AGENT workflow ID");
  }

  return runLamaticWorkflow({
    workflowId,
    payload: input,
  });
}



export async function runChatAgent({ message }: { message: string }) {
  const workflowId = process.env.CHATBOT_FLOW_ID;

  if (!workflowId) {
    throw new Error("Missing LAMATIC_CHATBOT_FLOW_ID");
  }

  return runLamaticWorkflow({
    workflowId,
    payload: {
      message, 
    },
  });
}