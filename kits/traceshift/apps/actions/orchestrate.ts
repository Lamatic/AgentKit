"use server";

import { headers } from "next/headers";
import { isAdvisorCandidate, isAdvisorProposal } from "@/lib/advisor-contract";
import {
  advisorQuotaSubject,
  consumeAdvisorQuota,
  verifyAdvisorAccess,
} from "@/lib/advisor-security";
import { getTraceShiftClient } from "@/lib/lamatic-client";
import type { AdvisorProposal, OptimizationCandidate } from "@/lib/types";

export type AdvisorResult =
  | { ok: true; proposal: AdvisorProposal }
  | { ok: false; error: string };

export async function requestAdvisorProposal(
  candidate: OptimizationCandidate,
  optimizationGoal: string,
  accessToken: string,
): Promise<AdvisorResult> {
  try {
    if (!verifyAdvisorAccess(accessToken)) {
      return { ok: false, error: "The Advisor access token is missing or invalid." };
    }
    const requestHeaders = await headers();
    const clientAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!consumeAdvisorQuota(advisorQuotaSubject(accessToken, clientAddress))) {
      return { ok: false, error: "The Advisor request limit was reached. Try again in one minute." };
    }
    if (!isAdvisorCandidate(candidate)) {
      return { ok: false, error: "The selected evidence pack is incomplete or invalid." };
    }
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
      statisticalConfidence: candidate.confidenceDetail,
      historicalBacktest: candidate.backtest ?? null,
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
    if (JSON.stringify(evidencePack).length > 50_000) {
      return { ok: false, error: "The selected evidence pack is too large for the Advisor." };
    }
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
    if (!isAdvisorProposal(proposal)) {
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
