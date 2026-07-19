const lowNode    = workflow.LLMNode_645.output;
const mediumNode = workflow.LLMNode_419.output;
const highNode    = workflow.LLMNode_353.output;
const elseNode    = workflow.codeNode_905.output;

function isSkipped(nodeOutput) {
  return !nodeOutput || (typeof nodeOutput === "object" && nodeOutput.executionMsg === "Skipped the node execution");
}

function cleanJsonString(str) {
  let cleaned = str.trim()
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned.trim();
}

let raw = null, tier = null;
if (!isSkipped(lowNode))          { raw = lowNode.generatedResponse;    tier = "low"; }
else if (!isSkipped(mediumNode))  { raw = mediumNode.generatedResponse; tier = "medium"; }
else if (!isSkipped(highNode))    { raw = highNode.generatedResponse;   tier = "high"; }

function isValidPayload(p) {
  return !!p && typeof p === "object"
    && typeof p.explanation === "string"
    && typeof p.recommended_action === "string";
}

if (raw) {
  let parsed;
  try {
    parsed = JSON.parse(cleanJsonString(raw));
  } catch (e) {
    return { risk_tier: tier, explanation: "Model output could not be parsed as JSON.", recommended_action: "Manual review recommended." };
  }
  if (!isValidPayload(parsed)) {
    return { risk_tier: tier, explanation: "Model output was valid JSON but missing required fields.", recommended_action: "Manual review recommended." };
  }
  return { risk_tier: tier, explanation: parsed.explanation, recommended_action: parsed.recommended_action };
}

// Else branch fired: none of the three tiers matched.
// Fall back to "medium" so the result still fits the documented low|medium|high contract.
if (!isSkipped(elseNode)) {
  return { risk_tier: "medium", explanation: elseNode.explanation, recommended_action: "verify_further" };
}

// Nothing ran at all — shouldn't happen if Condition node covers all cases
return { risk_tier: "medium", explanation: "Unable to determine risk tier due to an internal scoring error.", recommended_action: "verify_further" };