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

export async function analyze(fileUrl: string): Promise<AnalyzeResult> {
  const url = process.env.LAMATIC_API_URL;
  const projectId = process.env.LAMATIC_PROJECT_ID;
  const apiKey = process.env.LAMATIC_API_KEY;
  const flowId = process.env.EDA_ANALYST;

  if (!url || !projectId || !apiKey || !flowId) {
    return { ok: false, error: "Server is missing Lamatic environment configuration (.env.local)." };
  }
  if (!fileUrl || !/^https?:\/\//i.test(fileUrl)) {
    return { ok: false, error: "Please provide a public http(s) URL to a CSV file." };
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
    });

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
    return { ok: false, error: String(e?.message || e) };
  }
}
