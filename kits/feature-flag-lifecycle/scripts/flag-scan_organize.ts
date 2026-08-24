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

  // Validate each flag record has required fields with correct types
  for (const flag of parsed.flags) {
    if (!flag || typeof flag !== 'object') {
      throw new Error("LLM output contains a malformed flag record (not an object)");
    }
    if (typeof flag.flagName !== 'string') {
      throw new Error("LLM output flag record missing or non-string 'flagName'");
    }
    if (typeof flag.type !== 'string') {
      throw new Error("LLM output flag record missing or non-string 'type'");
    }
  }

  // Ensure totalFlags is a valid non-negative number
  const count = parsed.flags.length;
  if (typeof parsed.totalFlags !== 'number' || parsed.totalFlags < 0) {
    parsed.totalFlags = count;
  }

  output = parsed;
} catch (e) {
  output = {
    flags: [],
    totalFlags: 0,
    error: "Failed to parse LLM output: " + e.message
  };
}
