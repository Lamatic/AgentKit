const rawUserPrompt = {{triggerNode_1.output.rawUserPrompt}};

function maskDeterministic(input) {
  const PATTERNS = [
    { label: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { label: "SECRET_KEY", regex: /\b(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{30,}|xox[baprs]-[a-zA-Z0-9-]{10,}|[a-zA-Z0-9_-]{32,})\b/g },
    { label: "CREDIT_CARD", regex: /\b(?:\d[ -]*?){13,16}\b/g },
    { label: "PHONE", regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g }
  ];
  let maskedText = input;
  const tokenMap = {};
  let counter = 0;
  for (const { label, regex } of PATTERNS) {
    maskedText = maskedText.replace(regex, (match) => {
      if (match.startsWith("[REDACTED_")) return match;
      const placeholder = `[REDACTED_${label}_${counter}]`;
      tokenMap[placeholder] = match;
      counter += 1;
      return placeholder;
    });
  }
  return { maskedText, tokenMap, deterministicCount: counter };
}

output = maskDeterministic(rawUserPrompt);