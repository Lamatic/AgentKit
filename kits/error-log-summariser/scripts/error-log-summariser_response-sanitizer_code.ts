const response = {{LLMNode_262.output.generatedResponse}};

const text = typeof response === "string" ? response : JSON.stringify(response ?? "");

function hasSecretOrPii(value) {
  const patterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    /\b(?:sk|rk|pk|ak)_[A-Za-z0-9]{16,}\b/i,
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/,
    /(?:password|secret|token|api[_-]?key|connection string)\s*[:=]\s*[^\s]+/i,
    /\b(?:postgres(?:ql)?|mysql|mongodb|redis|amqp|jdbc):\/\/[\w\-.:@/?&=%]+/i,
  ];
  return patterns.some(pattern => pattern.test(value));
}

const requiredSections = [
  "Safe Summary",
  "Redactions Applied",
  "Likely Affected Component",
  "Escalation Questions",
  "Recommended Next Action",
  "Confidence",
];

const missingSections = requiredSections.filter(section => !text.includes(section));

if (missingSections.length > 0) {
  throw new Error(`Invalid summary: missing sections ${missingSections.join(", ")}`);
}

if (hasSecretOrPii(text)) {
  throw new Error("Invalid summary: secret or PII-like content detected in generated response");
}

output = {
  summary: text.trim(),
};
