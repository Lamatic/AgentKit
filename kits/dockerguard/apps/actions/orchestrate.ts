"use server";

import { getLamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";
import type { AuditReport, FileType } from "@/lib/types";

type AuditResponse =
  | { success: true; report: AuditReport }
  | { success: false; error: string };

/**
 * Pull the JSON report string out of whatever shape the flow returns.
 * The `dockerguard-audit` flow maps `report` to the LLM output, so we look
 * there first, then fall back to common alternatives.
 */
function extractReportString(resData: unknown): string | null {
  const r = resData as {
    result?: { report?: unknown };
    report?: unknown;
    output?: { report?: unknown };
  };
  const candidates: unknown[] = [
    r?.result?.report,
    r?.report,
    r?.result,
    r?.output?.report,
    resData,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
    if (c && typeof c === "object" && "findings" in c) return JSON.stringify(c);
  }
  return null;
}

/** Strip ```json fences the model may add, then parse. */
function parseReport(raw: string): AuditReport | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.findings)) {
      return null;
    }
    // Normalize the rest of the shape so a partial-but-parseable response can't
    // render a broken report (e.g. a NaN score).
    const score = Number(parsed.score);
    const inputType = ["dockerfile", "compose", "unknown"].includes(parsed.input_type)
      ? parsed.input_type
      : "unknown";
    return {
      input_type: inputType,
      score: Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0,
      grade: typeof parsed.grade === "string" ? parsed.grade : "F",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      findings: parsed.findings,
      passed_checks: Array.isArray(parsed.passed_checks) ? parsed.passed_checks : [],
    } as AuditReport;
  } catch {
    return null;
  }
}

export async function auditDockerfile(
  dockerfile: string,
  fileType: FileType,
  filename = ""
): Promise<AuditResponse> {
  if (!dockerfile.trim()) {
    return { success: false, error: "Please paste a Dockerfile or compose file." };
  }

  try {
    const flow = config.flows.audit;
    if (!flow.workflowId) {
      throw new Error("DOCKERGUARD_AUDIT flow ID is not configured.");
    }

    const client = getLamaticClient();
    const resData = await client.executeFlow(flow.workflowId, {
      dockerfile,
      file_type: fileType,
      filename,
    });

    const raw = extractReportString(resData);
    if (!raw) {
      throw new Error("The flow returned no report.");
    }

    const report = parseReport(raw);
    if (!report) {
      throw new Error(
        "Could not parse the audit report. The model may not have returned valid JSON — try again or lower the model temperature."
      );
    }

    return { success: true, report };
  } catch (error) {
    console.error("[DockerGuard] audit error:", error);

    let message = "Unknown error occurred.";
    if (error instanceof Error) {
      message = error.message;
      if (message.includes("fetch failed")) {
        message = "Network error: unable to reach Lamatic. Check your connection and API URL.";
      } else if (message.toLowerCase().includes("api key") || message.includes("credentials")) {
        message = "Authentication error: check your Lamatic API credentials in .env.local.";
      }
    }
    return { success: false, error: message };
  }
}
