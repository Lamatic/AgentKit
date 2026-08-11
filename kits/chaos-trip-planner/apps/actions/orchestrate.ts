"use server";

export type TripInput = {
  city: string;
  travelDate: string;
  days: number;
  budget: number;
  preferences: string;
};

async function callLamatic(query: string, variables: Record<string, any>) {
  const response = await fetch(process.env.LAMATIC_ENDPOINT!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LAMATIC_API_KEY}`,
      "Content-Type": "application/json",
      "x-project-id": process.env.LAMATIC_PROJECT_ID!,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(60000),
  });
  const json = await response.json();
  if (!response.ok || json.errors) {
    throw new Error(
      json.errors?.[0]?.message ??
        `Lamatic request failed (${response.status})`,
    );
  }
  return json;
}

export async function planTrip(input: TripInput) {
  if (!input.city?.trim()) {
    throw new Error("City is required");
  }
  if (!input.travelDate) {
    throw new Error("Travel date is required");
  }
  if (!Number.isFinite(input.days) || input.days < 1 || input.days > 30) {
    throw new Error("Days must be between 1 and 30");
  }
  if (!Number.isFinite(input.budget) || input.budget < 0) {
    throw new Error("Budget must be a positive number");
  }

  const executeQuery = `
    query ExecuteWorkflow(
      $workflowId: String!
      $city: String
      $days: Int
      $budget: Int
      $preferences: String
      $travelDate: String
    ) {
      executeWorkflow(
        workflowId: $workflowId
        payload: {
          city: $city
          days: $days
          budget: $budget
          preferences: $preferences
          travelDate: $travelDate
        }
      ) {
        status
        result
      }
    }
  `;

  const initial = await callLamatic(executeQuery, {
    workflowId: process.env.LAMATIC_FLOW_ID,
    city: input.city,
    days: input.days,
    budget: input.budget,
    preferences: input.preferences,
    travelDate: input.travelDate,
  });

  const result = initial.data?.executeWorkflow?.result;

  // Real data arrived immediately
  if (result && result.summary) {
    return result;
  }

  const requestId = result?.requestId;
  if (!requestId) {
    throw new Error("No result or requestId returned from Lamatic");
  }

  const statusQuery = `
    query CheckStatus($requestId: String!) {
      checkStatus(requestId: $requestId)
    }
  `;

  const maxAttempts = 20;
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    const statusResponse = await callLamatic(statusQuery, { requestId });
    const status = statusResponse.data?.checkStatus;

    if (status && status.output && status.output.summary) {
      return status.output;
    }
  }

  throw new Error("Timed out waiting for trip plan to generate");
}
