"use server";

import { getLamaticClient } from "@/lib/lamatic-client";

export type AnalyzeResult = {
  ok: boolean;
  dashboardHtml?: string;
  chartCount?: number;
  validated?: boolean;
  error?: string;
};

// The agent runs several LLM steps, so give it a generous deadline.
const TIMEOUT_MS = 120_000;

// The SDK's executeFlow has no built-in deadline, so race it against a timer to
// preserve the "timed out" UX. (The underlying request may keep running server-side.)
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("LAMATIC_TIMEOUT")), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
}

export async function analyze(fileUrl: string): Promise<AnalyzeResult> {
  const flowId = process.env.EDA_ANALYST; // flow ID mapped via the step's envKey in lamatic.config.ts
  if (!flowId) {
    return { ok: false, error: "Server is missing the EDA_ANALYST flow id (.env.local)." };
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
    const client = getLamaticClient();
    const res = await withTimeout(client.executeFlow(flowId, { fileUrl }), TIMEOUT_MS);

    if (res?.status === "error") {
      return { ok: false, error: res.message || "The Lamatic workflow returned an error." };
    }

    // `result` may come back as an object or as a JSON string.
    let result: any = res?.result;
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
    if (e?.message === "LAMATIC_TIMEOUT") {
      return { ok: false, error: "The analysis timed out. Try a smaller dataset." };
    }
    return { ok: false, error: String(e?.message || e) };
  }
}
