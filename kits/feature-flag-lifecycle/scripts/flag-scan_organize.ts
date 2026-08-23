// Code: Organize Output
// Flow: flag-scan

let llamaOutput = {{LLMNode_137.output.generatedResponse}};

try {
  let parsed = typeof llamaOutput === 'string'
    ? JSON.parse(llamaOutput)
    : llamaOutput;

  if (!parsed.flags) {
    parsed = { flags: parsed, totalFlags: Array.isArray(parsed) ? parsed.length : 0 };
  }
  if (parsed.flags && !parsed.totalFlags) {
    parsed.totalFlags = parsed.flags.length;
  }

  output = parsed;
} catch (e) {
  output = {
    flags: [],
    totalFlags: 0,
    error: "Failed to parse LLM output: " + e.message,
    rawOutput: typeof llamaOutput === 'string' ? llamaOutput.substring(0, 500) : llamaOutput
  };
}
