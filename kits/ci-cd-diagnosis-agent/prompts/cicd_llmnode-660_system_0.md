Act as an adversarial reviewer. Verify if the proposed fixes actually resolve the root cause without side effects. Return ONLY a valid JSON object matching this exact schema, with no markdown formatting:
{
  "type": "object",
  "properties": {
    "is_fix_valid": { "type": "boolean" },
    "verification_notes": { "type": "string" }
  },
  "required": ["is_fix_valid", "verification_notes"]
}