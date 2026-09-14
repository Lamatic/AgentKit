// lib/lamatic-client.ts
// Server-only: talks to your deployed Lamatic flow via GraphQL.
// This file must never be imported from a "use client" component —
// it reads secrets that should never reach the browser.

export interface ParallelMatch {
  domainA_element: string;
  domainB_element: string;
  shared_structure: string;
}

export interface CrossPollinatorResult {
  domainA_analysis: string;
  domainB_analysis: string;
  parallels: ParallelMatch[];
  proposed_innovation: string;
  evaluation: string;
  final_summary: string;
}

// Reads an env var and throws a clear error if it's missing —
// better than a silent undefined causing a confusing failure later.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function runNeuralCrossPollinator(
  domainA: string,
  domainB: string
): Promise<CrossPollinatorResult> {
  const apiUrl = requireEnv("LAMATIC_API_URL");
  const apiKey = requireEnv("LAMATIC_API_KEY");
  const projectId = requireEnv("LAMATIC_PROJECT_ID");
  const workflowId = requireEnv("NEURAL_CROSS_POLLINATOR_FLOW_ID");

  // Same GraphQL shape we manually tested working in Lamatic's API Playground.
  const query = `
    query ExecuteWorkflow($workflowId: String!, $domainA: String, $domainB: String) {
      executeWorkflow(
        workflowId: $workflowId
        payload: { domainA: $domainA, domainB: $domainB }
      ) {
        status
        result
      }
    }
  `;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "x-project-id": projectId
    },
    body: JSON.stringify({
      query,
      variables: { workflowId, domainA, domainB }
    })
  });

  if (!response.ok) {
    throw new Error(`Lamatic API request failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message ?? "Unknown error from Lamatic API");
  }

  const executed = json.data?.executeWorkflow;

  if (!executed || executed.status !== "success") {
    throw new Error("Flow execution did not return a success status");
  }

  return executed.result as CrossPollinatorResult;
}