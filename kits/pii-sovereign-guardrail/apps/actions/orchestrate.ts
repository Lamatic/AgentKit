"use server";
import { guardrailFlowId, callLamaticFlow } from "../lib/lamatic-client";

export interface GuardrailResult {
  secureResponse: string;
  maskedPromptSent: string;
  tokensRedacted: {
    total: number;
    deterministic: number;
    probabilistic: number;
  };
  demoMode?: boolean;
}

const ALLOWED_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
const MAX_PROMPT_LENGTH = 4000;

/**
 * Type-guards a Lamatic flow result, ensuring it has the exact shape
 * this app depends on (string fields, finite non-negative integer
 * redaction counts that sum correctly) before it's trusted and
 * returned to the caller.
 */
function isValidResult(value: unknown): value is {
  secureResponse: string;
  maskedPromptSent: string;
  tokensRedacted: { total: number; deterministic: number; probabilistic: number };
} {
  if (!value || typeof value !== "object") return false;
  const v = value as any;
  if (typeof v.secureResponse !== "string" || typeof v.maskedPromptSent !== "string") return false;
  if (!v.tokensRedacted || typeof v.tokensRedacted !== "object") return false;
  const { total, deterministic, probabilistic } = v.tokensRedacted;
  for (const n of [total, deterministic, probabilistic]) {
    if (!Number.isInteger(n) || n < 0) return false;
  }
  if (total !== deterministic + probabilistic) return false;
  return true;
}

/**
 * Runs the PII masking pipeline for a given prompt and target model.
 * Falls back to a local, Layer-1-only demo when no flow is deployed
 * (PII_GUARDRAIL_FLOW_ID unset); otherwise calls the real deployed
 * Lamatic flow and validates its result before returning it.
 *
 * @param rawUserPrompt - The raw, unmasked user prompt (max 4000 chars).
 * @param targetModel - One of ALLOWED_MODELS; the model the masked
 *   prompt will be sent to.
 * @returns The rehydrated response, the masked prompt that was sent
 *   externally, and a breakdown of what was redacted.
 */
export async function runGuardrail(
  rawUserPrompt: string,
  targetModel: string
): Promise<GuardrailResult> {
  if (typeof rawUserPrompt !== "string" || rawUserPrompt.trim().length === 0) {
    throw new Error("rawUserPrompt is required.");
  }
  if (rawUserPrompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`rawUserPrompt exceeds the ${MAX_PROMPT_LENGTH} character limit.`);
  }
  if (!ALLOWED_MODELS.includes(targetModel)) {
    throw new Error(`targetModel must be one of: ${ALLOWED_MODELS.join(", ")}`);
  }

  if (!guardrailFlowId) {
    const { runLocalDemoGuardrail } = await import("../lib/local-demo");
    return { ...runLocalDemoGuardrail(rawUserPrompt), demoMode: true };
  }

  const response = await callLamaticFlow(rawUserPrompt, targetModel);
  const result = response.result;
  if (!isValidResult(result)) {
    throw new Error("Lamatic flow returned an invalid or malformed result — masking pipeline failed.");
  }

  return {
    secureResponse: result.secureResponse,
    maskedPromptSent: result.maskedPromptSent,
    tokensRedacted: result.tokensRedacted,
    demoMode: false
  };
}