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

// Lamatic can return object/array-mapped fields as either a real
// JSON value OR a JSON-encoded string, depending on how the field's
// declared type resolves server-side. Guard against both shapes so
// a successful response never crashes the page on .map().
function normalizeParallels(value: unknown): ParallelMatch[] {
  if (Array.isArray(value)) {
    return value as ParallelMatch[];
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed as ParallelMatch[];
      }
    } catch {
      // fall through to the empty-array fallback below
    }
  }
  return [];
}

export async function runNeuralCrossPollinator(
  workflowId: string,
  domainA: string,
  domainB: string
): Promise<CrossPollinatorResult> {
  const apiUrl = requireEnv("LAMATIC_API_URL");
  const apiKey = requireEnv("LAMATIC_API_KEY");
  const projectId = requireEnv("LAMATIC_PROJECT_ID");

  // domainA/domainB are required by the flow's input schema, so the
  // GraphQL variables must be non-null (String!) to match — a
  // nullable declaration here can get rejected during validation
  // before the flow even runs.
  const query = `
    query ExecuteWorkflow($workflowId: String!, $domainA: String!, $domainB: String!) {
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

  const raw = executed.result ?? {};

  return {
    domainA_analysis: String(raw.domainA_analysis ?? ""),
    domainB_analysis: String(raw.domainB_analysis ?? ""),
    parallels: normalizeParallels(raw.parallels),
    proposed_innovation: String(raw.proposed_innovation ?? ""),
    evaluation: String(raw.evaluation ?? ""),
    final_summary: String(raw.final_summary ?? "")
  };
}