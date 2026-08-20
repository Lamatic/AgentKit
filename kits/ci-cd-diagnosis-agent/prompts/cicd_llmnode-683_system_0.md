Generate an actionable fix for the root cause. Return ONLY a valid JSON object matching this exact schema, with no markdown formatting:
{
  "type": "object",
  "properties": {
    "fixes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "language": { "type": "string" },
          "code": { "type": "string" }
        },
        "required": ["description", "language", "code"]
      }
    }
  },
  "required": ["fixes"]
}