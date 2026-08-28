// Code: Parse JSON
// Flow: adr-copilot

let rawResponse = {{LLMNode_1.output.generatedResponse}};
let answer = {};

try {
  if (typeof rawResponse === "string") {
    // Clean codeblock markers if present
    let cleaned = rawResponse.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }
    answer = JSON.parse(cleaned);
  } else {
    answer = rawResponse;
  }
} catch (e) {
  answer = {
    title: "Architecture Decision Record",
    status: "Proposed",
    markdownContent: typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse),
    error: "Raw response formatting fallback applied"
  };
}

output = answer;
