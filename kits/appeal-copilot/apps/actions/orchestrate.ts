"use server";

import { headers } from "next/headers";
import { getLamaticClient, isLamaticConfigured } from "../lib/lamatic-client";
import { getDemoResult, getExampleScenarios } from "../lib/demo-data";
import { MAX_ADDITIONAL_CONTEXT_CHARS, MAX_DENIAL_TEXT_CHARS } from "../lib/limits";
import type { AnalyzeDenialResponse, AppealResult } from "../lib/types";

// Kept below the 300s `maxDuration` exported from app/layout.tsx so the controlled
// timeout error below wins the race against the platform killing the function — which
// would otherwise surface to the user as an opaque 504.
const TIMEOUT_MS = 280000;

// Best-effort spend guard on the paid Lamatic flow. This is per-instance in-memory
// state: on serverless it resets on cold start and is not shared across instances, so
// it blunts a single client hammering a warm instance rather than acting as a real
// distributed rate limiter. Front the deployment with a shared store (Vercel KV,
// Upstash) or your platform's rate limiting if you expose this publicly.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const recentRequests = new Map<string, number[]>();
let lastPruneAt = 0;

async function isOverRequestBudget(): Promise<boolean> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  const client = forwardedFor?.split(",")[0]?.trim() || "unknown";

  const now = Date.now();
  const hits = (recentRequests.get(client) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  const overBudget = hits.length >= RATE_LIMIT_MAX_REQUESTS;

  // Only admitted requests are recorded. Counting rejected attempts too would let a
  // client's own retries keep refilling the window, so anything polling faster than the
  // window never recovers — a lockout rather than the documented 10-per-60s. It also
  // bounds the array at RATE_LIMIT_MAX_REQUESTS instead of growing with attack volume.
  if (!overBudget) hits.push(now);
  recentRequests.set(client, hits);

  // Sweep on a fixed interval rather than when the map grows past a size threshold: the
  // entries are IP-derived, so a size-gated sweep would retain identifiers of inactive
  // clients indefinitely on an instance that never crosses the threshold. Nothing older
  // than the current window is kept.
  if (now - lastPruneAt >= RATE_LIMIT_WINDOW_MS) {
    lastPruneAt = now;
    for (const [key, times] of recentRequests) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) recentRequests.delete(key);
    }
  }

  return overBudget;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Picks the closest demo scenario for arbitrary pasted text when running without Lamatic credentials. */
function guessDemoScenario(denialText: string): string {
  // Match on the claim number rather than the whole string: the scenarios embed dates
  // generated per request, so an exact text comparison would break if the client loaded
  // the example just before a date rolled over.
  const claimNumber = denialText.match(/Claim #(\w+)/)?.[1];
  const scenarioMatch = claimNumber
    ? getExampleScenarios().find((s) => s.denialText.includes(`Claim #${claimNumber}`))
    : undefined;
  if (scenarioMatch) return scenarioMatch.id;

  const text = denialText.toLowerCase();
  if (text.includes("prior auth") || text.includes("coding") || text.includes("duplicate")) return "administrative";
  if (text.includes("out-of-network") || text.includes("out of network") || text.includes("exclu")) return "coverage";
  return "medical-necessity";
}

export async function analyzeDenial(denialText: string, additionalContext: string): Promise<AnalyzeDenialResponse> {
  const trimmedDenialText = denialText.trim();
  if (!trimmedDenialText) {
    return { success: false, error: "Paste the denial letter or EOB text before analyzing." };
  }

  // Bounds are enforced ahead of the demo-mode branch so the request contract is identical
  // whether or not Lamatic is configured — otherwise an unbounded string would still reach
  // the scenario matching below. The client applies the same limits from lib/limits.ts, but
  // a Server Action is a public endpoint and cannot rely on that.
  if (trimmedDenialText.length > MAX_DENIAL_TEXT_CHARS) {
    return {
      success: false,
      error: `That denial letter is ${trimmedDenialText.length.toLocaleString()} characters. Please trim it to ${MAX_DENIAL_TEXT_CHARS.toLocaleString()} or paste only the relevant claim.`,
    };
  }

  const trimmedContext = additionalContext.trim();
  if (trimmedContext.length > MAX_ADDITIONAL_CONTEXT_CHARS) {
    return {
      success: false,
      error: `Additional context is limited to ${MAX_ADDITIONAL_CONTEXT_CHARS.toLocaleString()} characters.`,
    };
  }

  if (!isLamaticConfigured()) {
    const data = getDemoResult(guessDemoScenario(trimmedDenialText));
    return { success: true, data, demoMode: true };
  }

  // The request budget stays live-mode only: it guards paid model spend, and throttling
  // the zero-config demo would only degrade it.
  if (await isOverRequestBudget()) {
    return {
      success: false,
      error: "Too many analyses in a short time. Please wait a minute and try again.",
    };
  }

  try {
    const flowId = process.env.APPEAL_ANALYSIS_FLOW_ID as string;
    const resData = await withTimeout(
      getLamaticClient().executeFlow(flowId, {
        denialText: trimmedDenialText,
        additionalContext: trimmedContext,
      }),
      TIMEOUT_MS,
      "The AI provider is taking longer than usual to respond. This usually means their service is overloaded. Please try again in a few minutes."
    );

    // The Lamatic SDK wraps the flow's own output under a "result" key, and this flow's
    // outputMapping also names its top-level field "result" — so the actual structured
    // object is nested two levels deep: resData.result.result.
    const result = resData?.result?.result;
    if (!result) {
      throw new Error("Flow execution failed or returned no result.");
    }

    return { success: true, data: result as unknown as AppealResult };
  } catch (error: unknown) {
    let errorMessage = "An unexpected error occurred during analysis.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: unable to connect to the Lamatic service. Please check your internet connection.";
      }
    }
    return { success: false, error: errorMessage };
  }
}
