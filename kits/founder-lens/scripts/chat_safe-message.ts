let msg = {{triggerNode_1.output.message}};
return {
  safeMessage: (msg && String(msg).trim().length > 0)
    ? String(msg).trim()
    : 'Give me a full summary of my startup analysis'
};