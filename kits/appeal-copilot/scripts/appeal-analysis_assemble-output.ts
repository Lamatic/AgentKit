// Code: Assemble Final Output
// Flow: appeal-analysis

// The assess node's schema documents strengthScore as "integer 1-10", but JSON-schema
// `minimum`/`maximum` are not honoured in OpenAI's strict structured-output mode, so the
// bound is enforced here instead of in the node schema. Out-of-range or non-numeric
// scores collapse to null rather than rendering a nonsense gauge value.
const rawStrengthScore = Number({{InstructorLLMNode_949.output.strengthScore}});
const strengthScore = Number.isFinite(rawStrengthScore)
  ? Math.min(10, Math.max(1, Math.round(rawStrengthScore)))
  : null;

output = {
  denialCategory: {{InstructorLLMNode_481.output.category}},
  claimNumber: {{InstructorLLMNode_481.output.claimNumber}},
  denialReasonText: {{InstructorLLMNode_481.output.denialReasonText}},
  appealDeadline: {{InstructorLLMNode_481.output.appealDeadline}},
  daysRemaining: {{codeNode_657.output.daysRemaining}},
  urgencyLevel: {{codeNode_657.output.urgencyLevel}},
  appealLetter:
    {{LLMNode_613.output.generatedResponse}} ||
    {{LLMNode_548.output.generatedResponse}} ||
    {{LLMNode_675.output.generatedResponse}} ||
    {{LLMNode_931.output.generatedResponse}},
  strengthScore,
  missingEvidence: {{InstructorLLMNode_949.output.missingEvidence}},
  rationale: {{InstructorLLMNode_949.output.rationale}},
};
