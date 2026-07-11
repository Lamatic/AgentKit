const current = {{forLoopNode_824.output.currentValue}};

const schemaNote = current.schema_errors && current.schema_errors.length > 0
  ? `\nSchema Errors: ${current.schema_errors.join(", ")}`
  : "";

return {
  id: current.id,
  response: current.response,
  reason: current.reason,
  texts: [
    `Response: ${current.response}
Reason: ${current.reason}${schemaNote}`
  ]
};
