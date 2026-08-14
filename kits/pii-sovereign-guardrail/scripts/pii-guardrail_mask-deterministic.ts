/**
 * Layer 1 — Deterministic PII masking.
 *
 * Catches PII that has a predictable, well-defined structure: emails,
 * API keys / secret tokens, phone numbers, credit card numbers.
 * This layer has near-zero false negatives for well-formed instances of
 * these patterns, and near-zero false positives — regex is the right tool
 * for structurally regular data. It will NOT catch free-text PII like
 * names or addresses; that's Layer 2's job (mask-entities, LLM-based).
 *
 * This file is referenced from the flow via:
 *   "@scripts/pii-guardrail_mask-deterministic.ts"
 */

export interface DeterministicMaskResult {
  maskedText: string;
  tokenMap: Record<string, string>;
  deterministicCount: number;
}

// Ordered so more specific patterns (API keys) are checked before more
// generic ones (phone numbers) to reduce cross-matching.
const PATTERNS: { label: string; regex: RegExp }[] = [
  {
    label: "EMAIL",
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  },
  {
    // Common secret/API key shapes: sk-..., AKIA..., ghp_..., long hex/base64 blobs
    label: "SECRET_KEY",
    regex:
      /\b(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{30,}|xox[baprs]-[a-zA-Z0-9-]{10,}|[a-zA-Z0-9_-]{32,})\b/g
  },
  {
    label: "CREDIT_CARD",
    regex: /\b(?:\d[ -]*?){13,16}\b/g
  },
  {
    label: "PHONE",
    regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  }
];

export function maskDeterministic(input: string): DeterministicMaskResult {
  let maskedText = input;
  const tokenMap: Record<string, string> = {};
  let counter = 0;

  for (const { label, regex } of PATTERNS) {
    maskedText = maskedText.replace(regex, (match) => {
      // Avoid re-masking something already replaced by an earlier pattern
      if (match.startsWith("[REDACTED_")) return match;

      const placeholder = `[REDACTED_${label}_${counter}]`;
      tokenMap[placeholder] = match;
      counter += 1;
      return placeholder;
    });
  }

  return {
    maskedText,
    tokenMap,
    deterministicCount: counter
  };
}
