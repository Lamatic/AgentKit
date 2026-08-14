import { maskDeterministic } from "../../scripts/pii-guardrail_mask-deterministic";
import { rehydrateResponse } from "../../scripts/pii-guardrail_rehydrate";

/**
 * Runs only Layer 1 (deterministic regex masking) locally, without calling
 * any external LLM. This lets reviewers try the app immediately without
 * needing a deployed Lamatic flow or API keys. It's clearly labeled
 * `demoMode: true` in the UI — Layer 2 (LLM-based name/address detection)
 * only runs once PII_GUARDRAIL_FLOW_ID is set and the real flow is used.
 *
 * @param rawUserPrompt - The raw, unmasked user prompt.
 * @returns A GuardrailResult-shaped object with demoMode intentionally
 *   omitted (the caller sets it to true).
 */
export function runLocalDemoGuardrail(rawUserPrompt: string) {
  const { maskedText, tokenMap, deterministicCount } =
    maskDeterministic(rawUserPrompt);
  const simulatedModelOutput = `[demo mode — no LLM called]\n\nMasked prompt that would be sent externally:\n${maskedText}`;
  const { secureResponse, tokensRedacted } = rehydrateResponse(
    simulatedModelOutput,
    tokenMap,
    deterministicCount,
    0
  );
  return { secureResponse, tokensRedacted, maskedPromptSent: maskedText };
}