// Safely inspect the execution context for whichever node actually ran
const successData = {{codeNode_891.output}} || null;
const rejectData = {{codeNode_131.output}} || null;

// Pick the node that actually produced an output object
const activeData = successData || rejectData || {};

let finalDecision = activeData.decision || "REJECTED";
const rawFraudScore = activeData.fraudRiskScore;

const numericFraudScore = typeof rawFraudScore === "number"
  ? rawFraudScore
  : parseFloat(rawFraudScore);

// Deterministic Guardrail: Escalate to MANUAL_REVIEW if fraud risk exceeds 0.50
if (!isNaN(numericFraudScore) && numericFraudScore > 0.50) {
  finalDecision = "MANUAL_REVIEW";
}

output = {
  success: activeData.success ?? false,
  decision: finalDecision,
  confidenceScore: activeData.confidenceScore ?? 0,
  fraudRiskScore: rawFraudScore || "UNKNOWN",
  authenticityMatch: activeData.authenticityMatch ?? false,
  damageType: activeData.damageType || "None",
  policyReference: activeData.policyReference || "N/A",
  reasoning: activeData.reasoning || "Assessment completed without specific details."
};