Based on the error classification and evidence, generate 1 to 3 search queries to find the solution in the knowledge base.
Return ONLY a valid JSON object matching this exact schema, with no markdown formatting:
{
  "type": "object",
  "properties": {
    "queries": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "required": ["queries"]
}