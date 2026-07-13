export interface LamaticGraphQLResponse<T = unknown> {
  data?: {
    executeWorkflow?: {
      status: string;
      result: T;
    };
  };
  errors?: Array<{ message: string }>;
}

export function isLamaticConfigured(): boolean {
  return Boolean(
    process.env.LAMATIC_API_URL &&
      process.env.LAMATIC_API_KEY &&
      process.env.LAMATIC_PROJECT_ID
  );
}

export async function callLamaticGraphQL<T = unknown>(
  query: string,
  variables: Record<string, unknown>
): Promise<{ status?: string; result?: T; error?: string }> {
  const apiUrl = process.env.LAMATIC_API_URL;
  const apiKey = process.env.LAMATIC_API_KEY;

  if (!apiUrl || !apiKey) {
    return { error: "Lamatic API is not configured in environment variables." };
  }

  try {
    const res = await fetch(`${apiUrl}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "x-project-id": process.env.LAMATIC_PROJECT_ID ?? "",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Lamatic HTTP Error:", res.status, text);
      return { error: `Lamatic GraphQL error (${res.status}): ${text}` };
    }

    const json = (await res.json()) as LamaticGraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      console.error("Lamatic GraphQL Errors:", json.errors);
      return { error: json.errors[0].message };
    }

    const workflowOutput = json.data?.executeWorkflow;
    if (!workflowOutput) {
      return { error: "No executeWorkflow result returned from Lamatic API." };
    }

    return {
      status: workflowOutput.status,
      result: workflowOutput.result,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: `Network error connecting to Lamatic: ${message}` };
  }
}
