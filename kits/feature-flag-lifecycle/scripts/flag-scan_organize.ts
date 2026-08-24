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

  // Validate that parsed.flags is an array before returning
  if (!Array.isArray(parsed.flags)) {
    throw new Error("LLM output 'flags' is not an array");
  }

  if (!parsed.totalFlags) {
    parsed.totalFlags = parsed.flags.length;
  }

  output = parsed;
} catch (e) {
  output = {
    flags: [],
    totalFlags: 0,
    error: "Failed to parse LLM output: " + e.message
  };
}
