"use server";

import { executeDecisionPremortem } from "@/lib/lamatic-client";
import type { PremortemInput, PremortemResult } from "@/lib/types";

function isResult(value: unknown): value is PremortemResult {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PremortemResult>;
  return (
    typeof item.decisionSummary === "string" &&
    Array.isArray(item.assumptions) &&
    Array.isArray(item.failureModes) &&
    Array.isArray(item.experiments) &&
    !!item.recommendation &&
    Array.isArray(item.nextActions)
  );
}

export async function analyzeDecision(
  input: PremortemInput,
): Promise<
  | { success: true; data: PremortemResult }
  | { success: false; error: string }
> {
  const decision = input.decision.trim();
  if (decision.length < 20) {
    return {
      success: false,
      error: "Describe the decision in at least 20 characters.",
    };
  }
  if (decision.length > 4_000) {
    return {
      success: false,
      error: "Keep the decision under 4,000 characters.",
    };
  }

  try {
    const result = await executeDecisionPremortem({
      decision,
      context: input.context.trim().slice(0, 8_000),
      constraints: input.constraints.trim().slice(0, 4_000),
      timeHorizon: input.timeHorizon.trim().slice(0, 500),
    });
    if (!isResult(result)) {
      throw new Error("The flow returned an unexpected result shape.");
    }
    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analysis failed.";
    return { success: false, error: message };
  }
}
