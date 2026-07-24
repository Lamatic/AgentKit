// Code: Parse extracted JSON
// Flow: extract
//
// The LLM returns a JSON string. Lamatic injects that value as a string literal
// in place of the template variable at runtime, so we can call string methods on
// it directly. Parse defensively (stripping any stray markdown fences) so the
// flow always emits a structured object.

let extraction = {};
try {
  let raw = {{LLMNode_10.output.generatedResponse}};
  raw = String(raw).trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  extraction = JSON.parse(raw);
} catch (e) {
  extraction = { error: "Could not parse extraction JSON" };
}
output = { extraction };
