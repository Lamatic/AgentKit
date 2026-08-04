Analyze the root cause of the failure using the provided evidence and knowledge base documents. You MUST cite exact lines from the evidence. Return ONLY a valid JSON object matching this exact schema, with no markdown formatting:
{
  "type": "object",
  "properties": {
    "root_cause_summary": { "type": "string" },
    "detailed_explanation": { "type": "string" },
    "evidence_cited": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["root_cause_summary", "detailed_explanation", "evidence_cited"]
}