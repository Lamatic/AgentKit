// Code node: validate + normalize the generated suite.
// Runs AFTER the "Generate Text" node. Deterministic — no model calls here.
// Assigns stable IDs, drops malformed cases, and dedupes near-identical inputs
// so the LLM never grades what plain code can guarantee.
//
// In Studio: replace the value below by typing {{ and picking the Generate Text
// node's `generatedResponse` output. The model returns a JSON string, so we parse
// it robustly (stripping any ```json fences) before validating.

const modelOutput = {{Generate_Text.output.generatedResponse}};

const VALID_CATEGORIES = [
  "happy_path",
  "edge_case",
  "ambiguous",
  "out_of_scope",
  "adversarial",
];

// Accept the model's raw JSON string, an already-parsed object, an array, OR the
// whole LLM node output object (which carries the text under `generatedResponse`).
function parseCases(raw) {
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw)) return raw;
    if (typeof raw.generatedResponse === "string") return parseCases(raw.generatedResponse);
    return raw.cases || [];
  }
  if (typeof raw !== "string") return [];
  let text = raw.trim();
  // Strip ```json ... ``` or ``` ... ``` fences if the model added them.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();
  // Fall back to the first {...} block if there is surrounding prose.
  if (text[0] !== "{" && text[0] !== "[") {
    const brace = text.indexOf("{");
    if (brace >= 0) text = text.slice(brace);
  }
  try {
    const obj = JSON.parse(text);
    return Array.isArray(obj) ? obj : obj.cases || [];
  } catch (e) {
    return [];
  }
}

const cases = parseCases(modelOutput);

// Normalize a case's input to a stable string for dedupe.
const fingerprint = (c) => {
  try {
    return JSON.stringify(c && c.input ? c.input : {}).toLowerCase().trim();
  } catch (e) {
    return String(c && c.input);
  }
};

const seen = new Set();
const cleaned = [];

for (const c of cases) {
  if (!c || typeof c !== "object") continue;

  const category = VALID_CATEGORIES.includes(c.category)
    ? c.category
    : "edge_case";

  const expectedBehavior =
    typeof c.expectedBehavior === "string" && c.expectedBehavior.trim()
      ? c.expectedBehavior.trim()
      : "";

  // A case with no behavioral oracle is useless — drop it.
  if (!expectedBehavior) continue;

  const input =
    c.input && typeof c.input === "object" && !Array.isArray(c.input)
      ? c.input
      : {};

  const fp = category + "::" + fingerprint({ input });
  if (seen.has(fp)) continue;
  seen.add(fp);

  cleaned.push({
    id: "case_" + (cleaned.length + 1).toString().padStart(3, "0"),
    category,
    input,
    expectedBehavior,
    rationale: typeof c.rationale === "string" ? c.rationale : "",
  });
}

return {
  cases: cleaned,
  count: cleaned.length,
};
