const rawLog = {{triggerNode_1.output.log}};
const rawContext = {{triggerNode_1.output.context}};

if (typeof rawLog !== "string" || rawLog.trim().length === 0) {
  throw new Error("Invalid request: log must be a non-empty string");
}

if (rawContext !== undefined && rawContext !== null && typeof rawContext !== "string") {
  throw new Error("Invalid request: context must be a string when provided");
}

output = {
  log: rawLog,
  context: rawContext ?? "",
  promptPayload: JSON.stringify({
    error_log: rawLog,
    caller_context: rawContext ?? "",
  }),
};
