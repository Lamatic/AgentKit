// apps/lib/lamatic-client.ts

// We use a custom fetch implementation instead of the official Lamatic SDK (Lamatic.executeFlow) 
// because the SDK currently lacks support for AbortSignal cancellation, which is critical 
// for preventing indefinite hangs during our long-running LLM generation tasks.

export const lamaticClient = {
  executeGraphQL: async (query: string, variables: Record<string, any>) => {
    const apiKey = process.env.LAMATIC_API_KEY;
    const endpoint = process.env.LAMATIC_ENDPOINT;
    const projectId = process.env.LAMATIC_PROJECT_ID;
    
    if (!apiKey) {
      throw new Error("LAMATIC_API_KEY is not set in environment variables.");
    }
    if (!endpoint) {
      throw new Error("LAMATIC_ENDPOINT is not set in environment variables.");
    }
    if (!projectId) {
      throw new Error("LAMATIC_PROJECT_ID is not set in environment variables.");
    }

    // Set to 60 seconds (matching our Vercel maxDuration) to accommodate slow generation
    const LAMATIC_TIMEOUT_MS = 60_000; 

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-project-id": projectId,
      },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(LAMATIC_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Lamatic API error: ${response.status} - ${await response.text()}`);
    }

    const json = await response.json();
    
    // GraphQL errors are usually returned inside the JSON payload
    if (json.errors) {
      console.error("GraphQL Errors:", json.errors);
      throw new Error(json.errors[0].message);
    }

    return json.data.executeWorkflow;
  }
};