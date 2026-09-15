// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
// Input bindings mapped in Lamatic UI:

const vision = {{InstructorLLMNode_560.output}}
const evaluator = {{InstructorLLMNode_295.output}}

let decision = evaluator?.decision || "MANUAL_REVIEW";


if (decision === "APPROVE") {
  // Auto-Approved Claim
  output = {
    success: true,
    decision: "APPROVE",
    confidenceScore: evaluator?.confidenceScore ?? 0.95,
    fraudRiskScore: evaluator?.fraudRiskScore ?? 0.05,
    authenticityMatch: vision?.authenticityMatch ?? true,
    damageType: vision?.damageType || "VERIFIED_DAMAGE",
    policyReference: evaluator?.policyReference || "Standard Return Policy",
    reasoning: evaluator?.reasoning || "Claim complies with return policy guidelines."
  };
} 

else if(decision === "MANUAL_REVIEW") {
  // Flagged for Human Agent Review
  output = {
    success: true,
    decision: "MANUAL_REVIEW",
    confidenceScore: evaluator?.confidenceScore ?? 0.70,
    fraudRiskScore: evaluator?.fraudRiskScore ?? 0.45,
    authenticityMatch: vision?.authenticityMatch ?? true,
    damageType: vision?.damageType || "INCONCLUSIVE",
    policyReference: evaluator?.policyReference || "Section 4.1 - Manual Inspection Required",
    reasoning: evaluator?.reasoning || "Claim routed for manual human verification due to policy ambiguity or threshold criteria."
  };
} 

// Standard Policy Evaluator Rejection
else{
output = {
  success: false,
  decision: "REJECT",
  confidenceScore: evaluator?.confidenceScore ?? 0.90,
  fraudRiskScore: evaluator?.fraudRiskScore ?? 0.80,
  authenticityMatch: vision?.authenticityMatch ?? true,
  damageType: vision?.damageType || "NON_COVERED_DAMAGE",
  policyReference: evaluator?.policyReference || "Standard Return Exceptions",
  reasoning: evaluator?.reasoning || "Claim rejected based on store policy return criteria."
};
}