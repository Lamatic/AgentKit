const redacted = {{codeNode_redact.output}};
const attributions = {{InstructorLLMNode_attribute.output.attributions}};
const remediations = {{InstructorLLMNode_remediate.output.remediations}};

const SAVINGS_MULTIPLIER = {
  "eliminate-full": 1.0,
  "reduce-major": 0.7,
  "reduce-partial": 0.4,
  "reduce-minor": 0.15,
  "one-time-only": 0.0,
  "unknown": 0.0,
};

function round2(n) {
  return Math.round(n * 100) / 100;
}

function rehydrate(placeholderMap, token) {
  if (token && token in placeholderMap) {
    return placeholderMap[token];
  }
  return token;
}

function findAttribution(anomalyId) {
  return (attributions || []).find((r) => r.anomalyId === anomalyId) || null;
}

function findRemediation(anomalyId) {
  return (remediations || []).find((r) => r.anomalyId === anomalyId) || null;
}

const placeholderMap = redacted.placeholderMap || {};
let unattributedCount = 0;

const anomalies = (redacted.redactedAnomalies || []).map((a) => {
  const flags = [];
  const candidateIds = (a.candidateEvents || []).map((e) => e.id);

  const rawAttribution = findAttribution(a.id);
  let causeEventId = rawAttribution ? rawAttribution.causeEventId : null;
  let confidence = rawAttribution ? rawAttribution.confidence : "low";
  let evidence = rawAttribution ? rawAttribution.evidence : [];
  let reasoning = rawAttribution ? rawAttribution.reasoning : "No attribution result returned.";
  let rejectedCandidates = rawAttribution ? rawAttribution.rejectedCandidates : [];

  if (causeEventId !== null && !candidateIds.includes(causeEventId)) {
    causeEventId = null;
    flags.push("hallucinated-cause");
  }
  if (causeEventId === null) unattributedCount += 1;

  if (a.method === "drift" && confidence === "high") {
    confidence = "medium";
    flags.push("drift-confidence-capped");
  }

  const rawRemediation = findRemediation(a.id);
  let savingsKey = rawRemediation ? rawRemediation.savingsKey : "unknown";
  const action = rawRemediation ? rawRemediation.action : "No remediation suggested.";
  const rationale = rawRemediation ? rawRemediation.rationale : "";
  const effort = rawRemediation ? rawRemediation.effort : "medium";
  const risk = rawRemediation ? rawRemediation.risk : "medium";
  const prerequisites = rawRemediation ? rawRemediation.prerequisites : [];

  if (!(savingsKey in SAVINGS_MULTIPLIER)) {
    savingsKey = "unknown";
    flags.push("unknown-savings-key");
  }

  if (a.driver === "rate" && /usage|traffic|request volume|scale down/i.test(action || "")) {
    flags.push("usage-fix-on-rate-driven-anomaly");
  }

  const monthlyDeltaAbs = a.deltaAbs * (30 / 7);
  const estimatedMonthlySavings = round2(monthlyDeltaAbs * SAVINGS_MULTIPLIER[savingsKey]);

  return {
    id: a.id,
    groupKey: a.groupKey,
    service: a.service,
    region: a.region,
    subAccount: rehydrate(placeholderMap, a.subAccount),
    skuId: a.skuId,
    resourceType: a.resourceType,
    method: a.method,
    currentCost: a.currentCost,
    baselineCost: a.baselineCost,
    deltaAbs: a.deltaAbs,
    deltaPct: a.deltaPct,
    shareOfTotalDelta: a.shareOfTotalDelta,
    robustZ: a.robustZ,
    firstInflectionAt: a.firstInflectionAt,
    quantityDeltaPct: a.quantityDeltaPct,
    driver: a.driver,
    attribution: {
      anomalyId: a.id,
      causeEventId: causeEventId,
      confidence: confidence,
      evidence: evidence,
      reasoning: reasoning,
      rejectedCandidates: rejectedCandidates,
    },
    remediation: {
      anomalyId: a.id,
      action: action,
      rationale: rationale,
      effort: effort,
      risk: risk,
      prerequisites: prerequisites,
      savingsKey: savingsKey,
    },
    estimatedMonthlySavings: estimatedMonthlySavings,
    flags: flags,
  };
});

const sorted = anomalies
  .map((a, idx) => ({ a: a, idx: idx }))
  .sort((x, y) => Math.abs(y.a.deltaAbs) - Math.abs(x.a.deltaAbs) || x.idx - y.idx)
  .map((x) => x.a);

const totalCurrent = round2(sorted.reduce((sum, a) => sum + a.currentCost, 0));
const totalBaseline = round2(sorted.reduce((sum, a) => sum + a.baselineCost, 0));
const totalDeltaAbs = round2(totalCurrent - totalBaseline);
const totalDeltaPct = totalBaseline === 0 ? 0 : round2((totalDeltaAbs / totalBaseline) * 100);
const totalEstimatedSavings = round2(sorted.reduce((sum, a) => sum + a.estimatedMonthlySavings, 0));

const attributedCount = sorted.length - unattributedCount;
const execSummary =
  "Spend up $" + totalDeltaAbs.toFixed(2) + " (" + (totalDeltaPct >= 0 ? "+" : "") + totalDeltaPct.toFixed(1) + "%) vs prior period across " +
  sorted.length + " flagged anomal" + (sorted.length === 1 ? "y" : "ies") + ". " +
  attributedCount + " attributed to a specific change, " + unattributedCount + " unresolved. " +
  "Estimated recoverable spend: $" + totalEstimatedSavings.toFixed(2) + "/mo.";

output = {
  periodLabel: redacted.periodLabel,
  currency: redacted.currency,
  totalCurrent: totalCurrent,
  totalBaseline: totalBaseline,
  totalDeltaAbs: totalDeltaAbs,
  totalDeltaPct: totalDeltaPct,
  anomalies: sorted,
  totalEstimatedSavings: totalEstimatedSavings,
  unattributedCount: unattributedCount,
  execSummary: execSummary,
};
