"use server";

export type AnalyzeResult = {
  ok: boolean;
  dashboardHtml?: string;
  chartCount?: number;
  validated?: boolean;
  error?: string;
};

const QUERY = `query ExecuteWorkflow($workflowId: String!, $fileUrl: String) {
  executeWorkflow(workflowId: $workflowId, payload: { fileUrl: $fileUrl }) {
    status
    result
  }
}`;

// The agent runs several LLM steps, so give it a generous deadline.
const TIMEOUT_MS = 120_000;

export async function analyze(fileUrl: string): Promise<AnalyzeResult> {
  const url = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;
  const flowId = process.env.EDA_ANALYST; // flow ID mapped via the step's envKey in lamatic.config.ts

  if (!url || !projectId || !apiKey || !flowId) {
    return { ok: false, error: "Server is missing Lamatic environment configuration (.env.local)." };
  }

  // Input validation only. Note: this server action does NOT fetch the CSV itself —
  // it forwards `fileUrl` to the Lamatic flow, whose Extract node performs the fetch.
  // Network/SSRF handling therefore belongs to the platform, not this client.
  let parsed: URL;
  try {
    parsed = new URL(fileUrl);
  } catch {
    return { ok: false, error: "Please provide a valid URL to a CSV file." };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http(s) CSV URLs are supported." };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "x-project-id": projectId,
      },
      body: JSON.stringify({ query: QUERY, variables: { workflowId: flowId, fileUrl } }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      return { ok: false, error: `Lamatic API request failed (HTTP ${res.status}).` };
    }

    const json = await res.json();
    if (json.errors?.length) {
      return { ok: false, error: json.errors[0]?.message || "GraphQL error from Lamatic." };
    }

    const wf = json?.data?.executeWorkflow;
    if (!wf) return { ok: false, error: "Empty response from the workflow." };

    // `result` may come back as an object or as a JSON string.
    let result: any = wf.result;
    if (typeof result === "string") {
      try { result = JSON.parse(result); } catch { /* leave as-is */ }
    }

    const dashboardHtml: string | undefined = result?.dashboardHtml;
    if (!dashboardHtml) {
      return { ok: false, error: "The workflow did not return a dashboard. Check the flow output mapping." };
    }

    return {
      ok: true,
      dashboardHtml,
      chartCount: typeof result?.chartCount === "number" ? result.chartCount : undefined,
      validated: typeof result?.validated === "boolean" ? result.validated : undefined,
    };
  } catch (e: any) {
    if (e?.name === "TimeoutError") {
      return { ok: false, error: "The analysis timed out. Try a smaller dataset." };
    }
    return { ok: false, error: String(e?.message || e) };
  }
}
