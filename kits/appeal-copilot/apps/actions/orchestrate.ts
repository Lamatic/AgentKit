"use server";

import { getLamaticClient, isLamaticConfigured } from "../lib/lamatic-client";
import { getDemoResult, EXAMPLE_SCENARIOS } from "../lib/demo-data";
import type { AnalyzeDenialResponse, AppealResult } from "../lib/types";

const TIMEOUT_MS = 300000; // 5 minutes (matching Vercel Hobby maxDuration)

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
  const exactMatch = EXAMPLE_SCENARIOS.find((s) => s.denialText === denialText);
  if (exactMatch) return exactMatch.id;

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

  if (!isLamaticConfigured()) {
    const data = getDemoResult(guessDemoScenario(trimmedDenialText));
    return { success: true, data, demoMode: true };
  }

  try {
    const flowId = process.env.APPEAL_ANALYSIS_FLOW_ID as string;
    const resData = await withTimeout(
      getLamaticClient().executeFlow(flowId, {
        denialText: trimmedDenialText,
        additionalContext: additionalContext.trim(),
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
