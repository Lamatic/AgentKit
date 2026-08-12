import type {
  AnalysisReport,
  CacheBacktest,
  ConfidenceDetail,
  DataQuality,
  TraceNode,
} from "./types";

const EMPTY_FINGERPRINT = "none";
const rounded = (value: number, digits = 4): number => Number(value.toFixed(digits));

export const wilsonLowerBound = (successes: number, total: number, z = 1.96): number => {
  if (total <= 0) return 0;
  const probability = Math.min(1, Math.max(0, successes / total));
  const denominator = 1 + (z * z) / total;
  const centre = probability + (z * z) / (2 * total);
  const margin = z * Math.sqrt((probability * (1 - probability) + (z * z) / (4 * total)) / total);
  return Math.max(0, (centre - margin) / denominator);
};

type ConfidenceInput = {
  sampleSize: number;
  recurringObservations: number;
  totalRuns: number;
  stableObservations?: number | null;
  stabilityTotal?: number | null;
  dataQuality: DataQuality;
  blockers?: string[];
};

export function scoreConfidence(input: ConfidenceInput): ConfidenceDetail {
  const sampleScore = Math.min(100, (input.sampleSize / 30) * 100);
  const recurrenceLowerBound = wilsonLowerBound(
    Math.min(input.recurringObservations, input.totalRuns),
    input.totalRuns,
  );
  const hasStability =
    input.stableObservations !== null &&
    input.stableObservations !== undefined &&
    input.stabilityTotal !== null &&
    input.stabilityTotal !== undefined &&
    input.stabilityTotal > 0;
  const stabilityLowerBound = hasStability
    ? wilsonLowerBound(input.stableObservations!, input.stabilityTotal!)
    : null;
  const stabilityScore = stabilityLowerBound === null ? 60 : stabilityLowerBound * 100;
  const coverageScore =
    ((input.dataQuality.inputCoverage +
      input.dataQuality.outputCoverage +
      input.dataQuality.durationCoverage) /
      3) *
    100;
  const score = Math.round(
    sampleScore * 0.3 +
      recurrenceLowerBound * 100 * 0.25 +
      stabilityScore * 0.3 +
      coverageScore * 0.15,
  );

  const blockers = [...(input.blockers ?? [])];
  if (input.sampleSize < 5) blockers.push("Fewer than five supporting observations.");
  if (coverageScore < 60) blockers.push("Core input, output, or duration coverage is below 60%.");
  if (stabilityLowerBound !== null && stabilityLowerBound < 0.8) {
    blockers.push("The 95% lower bound for output stability is below 80%.");
  }

  const level = blockers.length > 0 || score < 55 ? "low" : score >= 78 ? "high" : "medium";
  const reasons = [
    `${input.sampleSize} supporting observations produced a sample score of ${sampleScore.toFixed(0)}/100.`,
    `The 95% recurrence lower bound is ${(recurrenceLowerBound * 100).toFixed(1)}%.`,
    stabilityLowerBound === null
      ? "Output stability is not applicable to this candidate type."
      : `The 95% output-stability lower bound is ${(stabilityLowerBound * 100).toFixed(1)}%.`,
    `Core evidence coverage is ${coverageScore.toFixed(1)}%.`,
  ];

  return {
    level,
    score,
    sampleSize: input.sampleSize,
    sampleScore: rounded(sampleScore, 1),
    recurrenceScore: rounded(recurrenceLowerBound * 100, 1),
    stabilityScore: rounded(stabilityScore, 1),
    coverageScore: rounded(coverageScore, 1),
    recurrenceLowerBound: rounded(recurrenceLowerBound),
    stabilityLowerBound:
      stabilityLowerBound === null ? null : rounded(stabilityLowerBound),
    blockers: [...new Set(blockers)],
    reasons,
  };
}

export function backtestExactCache(
  report: Pick<AnalysisReport, "executions">,
  target: string,
  lookupLatencySeconds = 0.005,
): CacheBacktest {
  const calls = report.executions
    .filter((execution) => execution.status === "success")
    .flatMap((execution) => execution.nodes)
    .filter((node) => node.name === target)
    .sort((a, b) => a.timestamp - b.timestamp);
  const groups = new Map<string, TraceNode[]>();
  for (const call of calls) {
    if (call.inputFingerprint === EMPTY_FINGERPRINT) continue;
    groups.set(call.inputFingerprint, [...(groups.get(call.inputFingerprint) ?? []), call]);
  }

  const repeated = [...groups.values()].filter((group) => group.length >= 2);
  const eligible = repeated.filter(
    (group) =>
      group.every((call) => call.outputFingerprint !== EMPTY_FINGERPRINT) &&
      new Set(group.map((call) => call.outputFingerprint)).size === 1,
  );
  const eligibleCalls = new Set(eligible.flat());
  const cacheHits = eligible.reduce((total, group) => total + group.length - 1, 0);
  const outputMismatches = repeated.reduce((total, group) => {
    const first = group[0]?.outputFingerprint;
    return total + group.slice(1).filter((call) => call.outputFingerprint !== first).length;
  }, 0);
  const baselineLatencySeconds = calls.reduce((total, call) => total + call.durationSeconds, 0);
  const baselineCost = calls.reduce((total, call) => total + call.cost, 0);
  const replayLatencySeconds = calls.reduce((total, call) => {
    if (!eligibleCalls.has(call)) return total + call.durationSeconds;
    const group = groups.get(call.inputFingerprint)!;
    return total + (group[0] === call ? call.durationSeconds : lookupLatencySeconds);
  }, 0);
  const replayCost = calls.reduce((total, call) => {
    if (!eligibleCalls.has(call)) return total + call.cost;
    const group = groups.get(call.inputFingerprint)!;
    return total + (group[0] === call ? call.cost : 0);
  }, 0);

  const gates: string[] = [];
  if (calls.length < 10) gates.push("At least 10 observed calls are required.");
  if (cacheHits < 3) gates.push("At least three historical cache hits are required.");
  if (outputMismatches > 0) gates.push("A repeated input produced more than one output fingerprint.");
  if (calls.some((call) => !call.hasInput || !call.hasOutput)) {
    gates.push("Every evaluated call must include both input and output evidence.");
  }

  return {
    target,
    calls: calls.length,
    distinctKeys: groups.size,
    repeatedKeys: repeated.length,
    eligibleKeys: eligible.length,
    cacheHits,
    cacheMisses: calls.length - cacheHits,
    outputMismatches,
    hitRate: calls.length ? rounded(cacheHits / calls.length) : 0,
    mismatchRate: repeated.length
      ? rounded(outputMismatches / repeated.reduce((sum, group) => sum + group.length - 1, 0))
      : 0,
    baselineLatencySeconds: rounded(baselineLatencySeconds),
    replayLatencySeconds: rounded(replayLatencySeconds),
    latencySavedSeconds: rounded(Math.max(0, baselineLatencySeconds - replayLatencySeconds)),
    baselineCost: rounded(baselineCost, 6),
    replayCost: rounded(replayCost, 6),
    costSaved: rounded(Math.max(0, baselineCost - replayCost), 6),
    lookupLatencySeconds,
    passed: gates.length === 0,
    gates,
  };
}
