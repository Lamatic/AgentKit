import type { AdvisorProposal, OptimizationCandidate } from "./types";

const isText = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isTextList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isText);

const isNonEmptyTextList = (value: unknown): value is string[] =>
  isTextList(value) && value.length > 0;

export function isAdvisorProposal(value: unknown): value is AdvisorProposal {
  if (!value || typeof value !== "object") return false;
  const proposal = value as Record<string, unknown>;
  return (
    isText(proposal.title) &&
    isText(proposal.recommendation) &&
    isText(proposal.rationale) &&
    isTextList(proposal.evidence) &&
    isTextList(proposal.risks) &&
    isNonEmptyTextList(proposal.validationPlan) &&
    isText(proposal.rollbackCondition) &&
    ["low", "medium", "high"].includes(String(proposal.confidence)) &&
    proposal.approvalRequired === true
  );
}

export function isAdvisorCandidate(value: unknown): value is OptimizationCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<OptimizationCandidate>;
  const numbers = [
    candidate.affectedRuns,
    candidate.recurrenceRate,
    candidate.measuredLatencySeconds,
    candidate.measuredCost,
    candidate.estimatedWindowLatencySavingsSeconds,
    candidate.estimatedWindowCostSavings,
  ];
  return (
    ["exact-cache", "deterministic-code", "model-rightsize", "reusable-subflow"].includes(
      String(candidate.type),
    ) &&
    isText(candidate.target) &&
    candidate.target.length <= 500 &&
    numbers.every((number) => typeof number === "number" && Number.isFinite(number)) &&
    (candidate.outputStability === null ||
      (typeof candidate.outputStability === "number" && Number.isFinite(candidate.outputStability))) &&
    isTextList(candidate.evidence) &&
    isTextList(candidate.assumptions) &&
    isText(candidate.risk) &&
    isTextList(candidate.validationPlan) &&
    Boolean(candidate.confidenceDetail && typeof candidate.confidenceDetail === "object")
  );
}
