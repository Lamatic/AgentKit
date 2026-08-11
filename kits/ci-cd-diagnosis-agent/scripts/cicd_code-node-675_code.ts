{{triggerNode_1.output.logContent}}
const logContent = {{triggerNode_1.output.logContent}}; 
// <-- Put the green chip exactly where XXX is!

let log = logContent || "";
if (log.length > 10000) { log = log.slice(-10000); }
log = log.replace(/(AKIA|A3T[A-Z0-9]|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g, "[REDACTED_AWS_KEY]");
log = log.replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_GITHUB_TOKEN]");

output = { cleanedLog: log };
