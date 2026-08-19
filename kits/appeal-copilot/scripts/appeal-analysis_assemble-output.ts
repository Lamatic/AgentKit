// Code: Assemble Final Output
// Flow: appeal-analysis

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
  strengthScore: {{InstructorLLMNode_949.output.strengthScore}},
  missingEvidence: {{InstructorLLMNode_949.output.missingEvidence}},
  rationale: {{InstructorLLMNode_949.output.rationale}},
};
