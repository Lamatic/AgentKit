function validateSchema(log) {
  if (!log.expected_schema || Object.keys(log.expected_schema).length === 0) {
    return { schema_errors: [] };
  }

  let parsedResponse;
  try {
    parsedResponse = typeof log.response === "string" ? JSON.parse(log.response) : log.response;
  } catch (e) {
    return { schema_errors: ["Response is not valid JSON but expected_schema was provided."] };
  }

  const errors = [];
  const expectedKeys = Object.keys(log.expected_schema || {});
  for (const key of expectedKeys) {
    if (!(key in parsedResponse)) {
      errors.push(`Missing required field: ${key}`);
    }
  }
  return { schema_errors: errors };
}

const currentLog = {{forLoopNode_584.output.currentValue}};
const grounding = {{InstructorLLMNode_330.output}};
const schemaResult = validateSchema(currentLog);

return {
  id: currentLog.id,
  response: currentLog.response,
  is_grounded: grounding.is_grounded,
  ungrounded_claims: grounding.ungrounded_claims,
  reason: grounding.reason,
  schema_errors: schemaResult.schema_errors
};