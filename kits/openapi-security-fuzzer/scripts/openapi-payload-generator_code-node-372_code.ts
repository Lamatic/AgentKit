// Helper to safely extract the tests array from the LLM output
function extractTests(output) {
  if (!output) return [];

  let parsed = output;

  // If the LLM returned a raw string, parse it first
  if (typeof output === 'string') {
    try {
      const cleanStr = output.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(cleanStr);
    } catch (e) {
      console.error("Failed to parse JSON string:", output);
      return [];
    }
  }

  // If the output is an explicit error payload, ignore it
  if (parsed && typeof parsed === 'object' && parsed.error) {
    return [];
  }

  // Handle cases where the output is wrapped under common keys
  if (parsed && typeof parsed === 'object' && !parsed.tests && !parsed.testSuite && !parsed.test_cases) {
    if (parsed.response) parsed = parsed.response;
    else if (parsed.content) parsed = parsed.content;
    else if (parsed.output) parsed = parsed.output;
    else if (parsed.data) parsed = parsed.data;

    // Re-parse if the unwrapped value is a stringified JSON
    if (typeof parsed === 'string') {
      try {
        const cleanStr = parsed.replace(/```(?:json)?/g, '').trim();
        parsed = JSON.parse(cleanStr);
      } catch (e) {
        return [];
      }
    }
  }

  if (!parsed) return [];

  // Check common key variations
  let tests = parsed.tests || parsed.testSuite || parsed.test_cases;

  if (!tests) {
    // If no key matched, check if the parsed object itself is an array of tests
    if (Array.isArray(parsed)) return parsed;
    return [];
  }

  if (Array.isArray(tests)) return tests;

  // If tests was returned as an object of keyed items
  if (typeof tests === 'object') {
    const values = Object.values(tests);
    if (values.length > 0 && typeof values[0] === 'object') {
      return values;
    }
    return [tests];
  }

  return [];
}

// Merge all generated payloads into a single test suite array
const testSuite = [
  ...extractTests({{InstructorLLMNode_975.output}}),
  ...extractTests({{InstructorLLMNode_193.output}}),
  ...extractTests({{InstructorLLMNode_428.output}}),
  ...extractTests({{InstructorLLMNode_195.output}}),
  ...extractTests({{InstructorLLMNode_990.output}}),
  ...extractTests({{InstructorLLMNode_111.output}}),
  ...extractTests({{InstructorLLMNode_857.output}})
];

return { testSuite };