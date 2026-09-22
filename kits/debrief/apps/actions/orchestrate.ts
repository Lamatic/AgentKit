"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getLamaticClient, hasValidConfig } from "@/lib/lamatic-client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type _KitConfig from "../../lamatic.config";
// Note: ../../lamatic.config is type-only here. A runtime import breaks
// `next build` under Turbopack with Module not found: Can't resolve
// '../../lamatic.config' (verified). Step id/envKey below mirrors
// lamatic.config.ts steps[0] to stay aligned without leaving apps dir.

const MAX_FEEDBACK_CHARS = 15000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitStore = new Map<string, number[]>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (valid.length >= RATE_LIMIT_MAX) return false;
  valid.push(now);
  rateLimitStore.set(key, valid);
  return true;
}

// ── Schema enforcement (server-side, fails loudly) ─────────
const DebriefSchema = z.object({
  summary: z.string().min(1, "summary must be non-empty"),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  action_items: z.array(z.string()),
});

export type DebriefOutput = z.infer<typeof DebriefSchema>;

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) return fenceMatch[1].trim();
    const braceStart = trimmed.indexOf("{");
    const braceEnd = trimmed.lastIndexOf("}");
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      return trimmed.slice(braceStart, braceEnd + 1);
    }
    return trimmed;
  }
}

function localFallback(feedback: string): DebriefOutput {
  const lower = feedback.toLowerCase();
  const strengths: string[] = [];
  const gaps: string[] = [];
  const actionItems: string[] = [];

  if (lower.includes("strong") || lower.includes("clear") || lower.includes("good"))
    strengths.push("Demonstrated clear communication and problem-solving under discussion");
  if (lower.includes("system design") || lower.includes("architecture"))
    strengths.push("Showed strength in system design / architecture thinking");
  if (lower.includes("coding") || lower.includes("speed"))
    strengths.push("Coding speed and implementation fluency noted");

  if (lower.includes("indexing") || lower.includes("detail") || lower.includes("edge"))
    gaps.push("Needs deeper detail on database / edge-case handling");
  if (lower.includes("struggled") || lower.includes("missed") || lower.includes("weak"))
    gaps.push("Missed some edge cases and follow-up depth expected for role level");
  if (strengths.length === 0 && gaps.length === 0) {
    gaps.push("Insufficient signal in notes to assess depth — gather more targeted examples");
  }

  if (gaps.some((g) => g.toLowerCase().includes("edge")))
    actionItems.push("Practice edge-case enumeration and test-case design on coding prompts");
  if (gaps.some((g) => g.toLowerCase().includes("database")))
    actionItems.push("Review database indexing trade-offs and prepare a 2-minute explainer");
  if (strengths.length > 0) {
    actionItems.push("Prepare STAR stories that link strengths to concrete project outcomes");
  }

  const dedup = (arr: string[]): string[] => [...new Set(arr)].slice(0, 5);

  let summary: string;
  if (strengths.length > 0 && gaps.length > 0) {
    summary =
      "Mixed feedback: strengths in communication/system thinking with gaps in detail and edge-case coverage.";
  } else if (strengths.length > 0) {
    summary = "Positive signal on communication and technical approach with limited gaps noted.";
  } else if (gaps.length > 0) {
    summary = "Gaps in detail and edge-case handling noted; limited strengths evidenced.";
  } else {
    summary = "Limited signal in notes to assess.";
  }

  return {
    summary,
    strengths: dedup(strengths),
    gaps: dedup(gaps),
    action_items: dedup(actionItems),
  };
}

export async function summarizeFeedback(feedback: string): Promise<{
  success: boolean;
  data?: DebriefOutput;
  error?: string;
  fallback?: boolean;
}> {
  try {
    if (!feedback || !feedback.trim()) {
      throw new Error("Feedback is required");
    }

    const trimmed = feedback.trim();
    if (trimmed.length > MAX_FEEDBACK_CHARS) {
      throw new Error(`Feedback too large: max ${MAX_FEEDBACK_CHARS} characters (got ${trimmed.length})`);
    }
    let clientKey = "global";
    try {
      const h = await headers();
      const forwarded = (h.get("x-forwarded-for") || h.get("x-real-ip") || "").split(",")[0]?.trim();
      if (forwarded) clientKey = forwarded;
    } catch {}
    if (!checkRateLimit(clientKey)) {
      throw new Error("Rate limit exceeded: too many requests, please try again shortly.");
    }
    const inputs: Record<string, unknown> = { feedback: trimmed };

    // Mirrors lamatic.config.ts steps[0]: { id: "summarize-feedback", envKey: "SUMMARIZE_FEEDBACK" }
    const _kitSteps = [
      { id: "summarize-feedback", envKey: "SUMMARIZE_FEEDBACK" },
    ] as const;
    const step = _kitSteps.find((s) => s.id === "summarize-feedback");
    const envKey = (step?.envKey ?? "SUMMARIZE_FEEDBACK") as string;
    const flowId = process.env[envKey as keyof NodeJS.ProcessEnv] as string | undefined;
    const hasCreds = Boolean(flowId && hasValidConfig());

    let rawResult: string;

    if (hasCreds) {
      const resData = await getLamaticClient().executeFlow(flowId as string, inputs);
      const possible =
        (resData as { result?: unknown })?.result ??
        (resData as { data?: unknown })?.data;

      if (typeof possible === "string") {
        rawResult = possible;
      } else if (possible !== null && typeof possible === "object") {
        const obj = possible as Record<string, unknown>;
        if ("result" in obj) {
          const inner = obj["result"];
          if (typeof inner === "string") rawResult = inner;
          else if (inner !== null && typeof inner === "object") rawResult = JSON.stringify(inner);
          else rawResult = JSON.stringify(obj);
        } else if ("summary" in obj) {
          rawResult = JSON.stringify(obj);
        } else {
          rawResult = JSON.stringify(obj);
        }
      } else {
        throw new Error("No result returned from flow");
      }
    } else {
      const fallback = localFallback(trimmed);
      const parsed = DebriefSchema.parse(fallback);
      return { success: true, data: parsed, fallback: true };
    }

    const jsonStr = extractJson(rawResult);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonStr);
    } catch {
      const cid = Math.random().toString(36).slice(2, 8);
      console.error("[Debrief] malformed JSON", { cid, length: rawResult.length });
      throw new Error(`Model returned malformed JSON (ref: ${cid})`);
    }
    if (typeof parsedJson === "string") {
      try {
        parsedJson = JSON.parse(extractJson(parsedJson));
      } catch {
        // keep as string for Zod to fail loudly
      }
    }
    if (
      parsedJson !== null &&
      typeof parsedJson === "object" &&
      "result" in (parsedJson as Record<string, unknown>) &&
      !("summary" in (parsedJson as Record<string, unknown>))
    ) {
      const inner = (parsedJson as Record<string, unknown>)["result"];
      if (typeof inner === "string") {
        try {
          parsedJson = JSON.parse(extractJson(inner));
        } catch {
          parsedJson = inner;
        }
      } else {
        parsedJson = inner;
      }
    }

    const validated = DebriefSchema.parse(parsedJson);

    if (
      typeof validated.summary !== "string" ||
      !Array.isArray(validated.strengths) ||
      !Array.isArray(validated.gaps) ||
      !Array.isArray(validated.action_items)
    ) {
      throw new Error("Schema validation failed: incorrect types after parse");
    }

    return { success: true, data: validated };
  } catch (error) {
    const cid = Math.random().toString(36).slice(2, 8);
    console.error("[Debrief] summarize error", { cid, name: (error as Error).name });
    let errorMessage = "Unknown error occurred";
    if (error instanceof z.ZodError) {
      errorMessage = `Schema validation failed: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")} (ref: ${cid})`;
    } else if (error instanceof Error) {
      const msg = error.message;
      if (msg.includes("malformed JSON")) {
        errorMessage = msg;
      } else if (msg.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to Lamatic. Check network and credentials.";
      } else if (msg.toLowerCase().includes("api key")) {
        errorMessage = "Authentication error: Verify LAMATIC_API_KEY and project IDs.";
      } else if (
        msg === "Feedback is required" ||
        msg === "No result returned from flow" ||
        msg.startsWith("Feedback too large") ||
        msg.startsWith("Rate limit exceeded")
      ) {
        errorMessage = msg;
      } else {
        errorMessage = `Request failed (ref: ${cid})`;
      }
    }
    return { success: false, error: errorMessage };
  }
}
