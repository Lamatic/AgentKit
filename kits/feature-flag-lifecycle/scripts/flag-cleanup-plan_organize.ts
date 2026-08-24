// Code: Organize Cleanup Plan
// Flow: flag-cleanup-plan

let llamaOutput = {{LLMNode_215.output.generatedResponse}};

try {
  let parsed = typeof llamaOutput === 'string'
    ? JSON.parse(llamaOutput)
    : llamaOutput;

  // Validate the parsed schema before returning
  if (!parsed || typeof parsed !== 'object') {
    throw new Error("LLM output is not a valid object");
  }
  if (!Array.isArray(parsed.cleanupPlan)) {
    throw new Error("LLM output 'cleanupPlan' is not an array");
  }
  if (!parsed.summary || typeof parsed.summary !== 'object') {
    throw new Error("LLM output 'summary' is missing or invalid");
  }

  // Ensure summary has required fields with defaults
  parsed.summary = parsed.summary || {};
  parsed.summary.totalFlags = parsed.summary.totalFlags || 0;
  parsed.summary.removableFlags = parsed.summary.removableFlags || 0;
  parsed.summary.activeFlags = parsed.summary.activeFlags || 0;
  parsed.summary.cleanupSavings = parsed.summary.cleanupSavings || "";

  output = parsed;
} catch (e) {
  // Propagate the error as data so callers can distinguish failure from an empty plan
  output = {
    cleanupPlan: [],
    summary: { totalFlags: 0, removableFlags: 0, activeFlags: 0, cleanupSavings: "" },
    error: "Failed to parse LLM output: " + e.message
  };
}
