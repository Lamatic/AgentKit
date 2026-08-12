"use server";

import { getTraceShiftClient } from "@/lib/lamatic-client";
import type { AdvisorProposal, OptimizationCandidate } from "@/lib/types";

export type AdvisorResult =
  | { ok: true; proposal: AdvisorProposal }
  | { ok: false; error: string };

const isProposal = (value: unknown): value is AdvisorProposal => {
  if (!value || typeof value !== "object") return false;
  const proposal = value as Record<string, unknown>;
  return (
    typeof proposal.title === "string" &&
    typeof proposal.recommendation === "string" &&
    Array.isArray(proposal.evidence) &&
    Array.isArray(proposal.validationPlan)
  );
};

export async function requestAdvisorProposal(
  candidate: OptimizationCandidate,
  optimizationGoal: string,
): Promise<AdvisorResult> {
  try {
    const evidencePack = {
      optimizationGoal:
        optimizationGoal.trim() || "Reduce latency and cost without changing behavior",
      candidateType: candidate.type,
      target: candidate.target,
      measuredEvidence: candidate.evidence,
      affectedRuns: candidate.affectedRuns,
      recurrenceRate: Number(candidate.recurrenceRate.toFixed(4)),
      outputStability:
        candidate.outputStability === null ? null : Number(candidate.outputStability.toFixed(4)),
      measuredLatencySeconds: candidate.measuredLatencySeconds,
      measuredCost: candidate.measuredCost,
      scenarioEstimate: {
        latencySavingsSeconds: candidate.estimatedWindowLatencySavingsSeconds,
        costSavings: candidate.estimatedWindowCostSavings,
      },
      assumptions: candidate.assumptions,
      knownRisk: candidate.risk,
      requiredValidation: candidate.validationPlan,
      productionMutationAllowed: false,
    };
    const { client, flowId } = getTraceShiftClient();
    const response = (await client.executeFlow(flowId, {
      evidencePack: JSON.stringify(evidencePack),
    })) as { result?: { proposal?: unknown } };
    let proposal = response?.result?.proposal;
    if (typeof proposal === "string") {
      try {
        proposal = JSON.parse(proposal);
      } catch {
        return { ok: false, error: "The advisor returned text instead of the configured proposal schema." };
      }
    }
    if (!isProposal(proposal)) {
      return { ok: false, error: "The advisor response did not match the configured proposal schema." };
    }
    return { ok: true, proposal };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "The Lamatic advisor could not be reached.",
    };
  }
}
