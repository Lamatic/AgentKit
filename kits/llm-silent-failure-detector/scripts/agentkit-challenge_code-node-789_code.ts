const allResults = {{ forLoopEndNode_195.output.loopOutput }};

const flagged = [];

for (const r of allResults) {
  const grounding = r.InstructorLLMNode_330.output;
  const schema = r.codeNode_805.output;

  if (!grounding.is_grounded || (schema.schema_errors && schema.schema_errors.length > 0)) {
    flagged.push({
      id: schema.id,
      response: schema.response,
      is_grounded: grounding.is_grounded,
      ungrounded_claims: grounding.ungrounded_claims,
      reason: grounding.reason,
      schema_errors: schema.schema_errors
    });
  }
}

return {
  flagged_logs: flagged,
  flagged_count: flagged.length
};
