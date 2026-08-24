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

  // Validate each cleanup item has required fields with correct types
  for (const item of parsed.cleanupPlan) {
    if (!item || typeof item !== 'object') {
      throw new Error("LLM output contains a malformed cleanup item (not an object)");
    }
    if (typeof item.flagName !== 'string') {
      throw new Error("LLM output cleanup item missing or non-string 'flagName'");
    }
  }

  if (!parsed.summary || typeof parsed.summary !== 'object') {
    throw new Error("LLM output 'summary' is missing or invalid");
  }

  // Validate and default all summary count fields as non-negative numbers
  parsed.summary = parsed.summary || {};
  const numField = (val) => typeof val === 'number' && val >= 0 ? val : 0;
  parsed.summary.totalFlags = numField(parsed.summary.totalFlags);
  parsed.summary.removableFlags = numField(parsed.summary.removableFlags);
  parsed.summary.activeFlags = numField(parsed.summary.activeFlags);
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
