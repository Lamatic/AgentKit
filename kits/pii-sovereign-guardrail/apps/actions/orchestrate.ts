"use server";
import { guardrailFlowId, createLamaticClient } from "../lib/lamatic-client";

export interface GuardrailResult {
  secureResponse: string;
  maskedPromptSent: string;
  tokensRedacted: {
    total: number;
    deterministic: number;
    probabilistic: number;
  };
  // Populated only in local demo mode (no deployed flow ID yet), so
  // reviewers can see the redaction pipeline working before wiring up
  // a real Lamatic Studio deployment.
  demoMode?: boolean;
}

export async function runGuardrail(
  rawUserPrompt: string,
  targetModel: string
): Promise<GuardrailResult> {
  if (!guardrailFlowId) {
    // No deployed flow yet — fall back to a local demo so the app is
    // still usable out of the box. Swap this out once PII_GUARDRAIL_FLOW_ID
    // is set in .env.local.
    const { runLocalDemoGuardrail } = await import("../lib/local-demo");
    return { ...runLocalDemoGuardrail(rawUserPrompt), demoMode: true };
  }

  const lamatic = createLamaticClient();
  const response = await lamatic.executeFlow(guardrailFlowId, {
    rawUserPrompt,
    targetModel
  });
  return {
    secureResponse: response.secureResponse,
    maskedPromptSent: response.maskedPromptSent,
    tokensRedacted: response.tokensRedacted,
    demoMode: false
  };
}