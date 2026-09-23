"use server";

import { parsePlan, extractFacts } from "../lib/plan-parse";
import kit from "../../lamatic.config";
import { getLamaticClient, flowIdFor } from "../lib/lamatic-client";
import { validateReviewResult } from "../lib/validate";
import type { ReviewResult, ReviewResponse } from "../lib/types";

/**
 * The SDK reports failures as a value — `{ status: "error", message }` — rather
 * than throwing, so check for that before unwrapping. On success the payload is
 * either the API Response body directly or wrapped in `result`; the body is
 * then validated field by field before it can reach the UI.
 */
function unwrap(raw: unknown): ReviewResult {
  const r = raw as { status?: string; message?: string; statusCode?: number; result?: unknown } | null;
  if (r?.status === "error" || r?.message) {
    const code = r?.statusCode ? ` (HTTP ${r.statusCode})` : "";
    throw new Error(`Lamatic rejected the request${code}: ${r?.message ?? "unknown error"}`);
  }
  return validateReviewResult(r?.result ?? r);
}

// The step this action runs, taken from the kit metadata so the two cannot drift.
const REVIEW_STEP = kit.steps.find((s) => s.id === "tf-plan-review") ?? (() => { throw new Error("lamatic.config.ts declares no tf-plan-review step."); })();

export async function reviewPlan(planText: string): Promise<ReviewResponse> {
  try {
    const plan = parsePlan(planText);
    const facts = extractFacts(plan);

    // Nothing to judge: answer locally, no model call.
    if (facts.totalChanges === 0) {
      return {
        ok: true,
        data: {
          verdict: "no-changes",
          summary: "The plan contains no resource changes (all no-op).",
          totalChanges: 0,
          counts: { critical: 0, high: 0, medium: 0, low: 0, unclassified: 0 },
          changes: [],
          reviewComment: null,
          policiesConsulted: [],
          droppedAssessments: 0,
          invalidFacts: 0,
        },
      };
    }

    const client = getLamaticClient();
    const raw = await client.executeFlow(flowIdFor(REVIEW_STEP.id), {
      // The trigger declares `changes` as [string]: Studio's schema accepts only
      // [] or [string] for arrays, so each fact crosses as JSON text and the
      // flow's assemble node parses it back.
      changes: facts.facts.map((f) => JSON.stringify(f)),
      totalChanges: facts.totalChanges,
      summary: facts.summary,
    });

    return { ok: true, data: unwrap(raw) };
  } catch (e: unknown) {
    // Errors go back as values; a thrown error inside a server action renders
    // as a blank screen in the client component.
    let message = e instanceof Error ? e.message : "Review failed.";
    if (message.includes("fetch failed")) {
      message = "Could not reach Lamatic. Check LAMATIC_API_URL and your network connection.";
    } else if (message.includes("HTTP 403")) {
      message += " — check LAMATIC_API_KEY is an API key from Studio > Settings > API Keys, not the Project ID.";
    }
    return { ok: false, error: message };
  }
}
