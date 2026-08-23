// Code: Organize Cleanup Plan
// Flow: flag-cleanup-plan

let llamaOutput = {{LLMNode_215.output.generatedResponse}};

try {
  let parsed = typeof llamaOutput === 'string'
    ? JSON.parse(llamaOutput)
    : llamaOutput;

  output = parsed;
} catch (e) {
  output = {
    cleanupPlan: [],
    summary: { totalFlags: 0, removableFlags: 0, activeFlags: 0 },
    error: "Failed to parse LLM output: " + e.message
  };
}
