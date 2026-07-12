// apps/lib/lamatic-client.ts

// We use a custom fetch client to handle your specific Lamatic GraphQL endpoint
export const lamaticClient = {
  executeGraphQL: async (query: string, variables: Record<string, any>) => {
    const apiKey = process.env.LAMATIC_API_KEY;
    
    if (!apiKey) {
      throw new Error("LAMATIC_API_KEY is not set in environment variables.");
    }

    // Your specific Lamatic GraphQL endpoint
    const endpoint = "https://aslansorganization334-contextuallanguagelearning766.lamatic.dev"; 

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-project-id": "db4a7514-c929-48cf-bffd-63adeef682db",
      },
      body: JSON.stringify({ query, variables }),
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