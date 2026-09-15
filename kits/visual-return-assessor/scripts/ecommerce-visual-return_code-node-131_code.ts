// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
  // Fast-Track Rejection (Tampering/Fake Item)
  vision = {{InstructorLLMNode_560.output}}
  
  output = {
    success: false,
    decision: "REJECT",
    confidenceScore: 0.95,
    fraudRiskScore: 1.0,
    authenticityMatch: vision?.authenticityMatch ?? false,
    damageType: vision?.damageType || "UNAUTHORIZED_TAMPERING",
    policyReference: "Section 1.2 - Authenticity & Fraud Policy",
    reasoning: "Failed automated visual verification. Item visual signature does not match records or shows unauthorized tampering."
  };