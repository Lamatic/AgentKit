const response = {{LLMNode_262.output.generatedResponse}};

const text = typeof response === "string" ? response : JSON.stringify(response ?? "");

function hasSecretOrPii(value) {
  const patterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/,
    /\b(?:[A-F0-9]{1,4}:){2,7}[A-F0-9]{1,4}\b/i,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bghp_[A-Za-z0-9_]{20,}\b/,
    /\bxoxb-[A-Za-z0-9-]{20,}\b/,
    /\b(?:sk|rk|pk|ak)_[A-Za-z0-9]{16,}\b/i,
    /\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/i,
    /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/,
    /\b(?:customer[_-]?id|customerId)\s*[:=]\s*["']?\d{6,}["']?/i,
    /(?:password|secret|token|api[_-]?key|connection string|authorization)\s*[:=]\s*[^\s]+/i,
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

const missingSections = requiredSections.filter((section, index) => {
  const headingPattern = new RegExp(`^##\\s+${section}\\s*$`, "m");
  const headingMatch = headingPattern.exec(text);
  if (!headingMatch) {
    return true;
  }

  const contentStart = headingMatch.index + headingMatch[0].length;
  const nextHeadingPattern = index + 1 < requiredSections.length
    ? new RegExp(`^##\\s+${requiredSections[index + 1]}\\s*$`, "m")
    : null;
  const nextHeadingMatch = nextHeadingPattern
    ? nextHeadingPattern.exec(text.slice(contentStart))
    : null;
  const contentEnd = nextHeadingMatch
    ? contentStart + nextHeadingMatch.index
    : text.length;
  return text.slice(contentStart, contentEnd).trim().length === 0;
});

if (missingSections.length > 0) {
  throw new Error(`Invalid summary: missing sections ${missingSections.join(", ")}`);
}

if (hasSecretOrPii(text)) {
  throw new Error("Invalid summary: secret or PII-like content detected in generated response");
}

output = {
  summary: text.trim(),
};
