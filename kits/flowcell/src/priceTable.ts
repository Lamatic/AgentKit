// Static per-model price table (USD per 1k tokens).
// Editable constants — an execution-budget estimate, NOT authoritative billing.

export interface ModelPrice {
  inputPer1k: number;
  outputPer1k: number;
}

export const PRICE_TABLE: Record<string, ModelPrice> = {
  "default": { inputPer1k: 0.0015, outputPer1k: 0.002 },
  "fallback-cheap": { inputPer1k: 0.0005, outputPer1k: 0.0005 },
};

export const DEFAULT_MODEL_KEY = "default";
export const FALLBACK_MODEL_KEY = "fallback-cheap";

/** Rough token estimate: ~4 chars per token. */
export function estimateTokens(text: string): number {
  if (!text) return 1;
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Estimated cost of one call for a serialized input payload. */
export function estimateCallCost(
  input: unknown,
  modelKey: string = DEFAULT_MODEL_KEY,
): number {
  const price = PRICE_TABLE[modelKey] ?? PRICE_TABLE[DEFAULT_MODEL_KEY];
  const serialized = typeof input === "string" ? input : JSON.stringify(input ?? "");
  const inputTokens = estimateTokens(serialized);
  // Assume the response is roughly the same size as the request.
  const outputTokens = inputTokens;
  return (
    (inputTokens / 1000) * price.inputPer1k +
    (outputTokens / 1000) * price.outputPer1k
  );
}
