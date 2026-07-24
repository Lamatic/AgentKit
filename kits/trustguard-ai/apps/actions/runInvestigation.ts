"use server";
// actions/runInvestigation.ts
// Next.js Server Action — calls the TrustGuard AI Lamatic flow.
// NEVER imports client-only code. Uses server-only env vars.

import { getLamaticClient, getFlowId } from "@/lib/lamatic";
import { InvestigationResponseSchema } from "@/lib/schemas";
import type { AnalyzeFormData } from "@/types/response";
import type { ValidatedInvestigationResponse } from "@/lib/schemas";


/**
 * Discriminated union returned by the `runInvestigation` server action.
 *
 * Narrows automatically via the `success` discriminant:
 * - `success: true`  → `data` is always present, `error` is absent.
 * - `success: false` → `error` is always present, `data` is absent.
 */
export type RunInvestigationResult =
  | { readonly success: true; readonly data: ValidatedInvestigationResponse }
  | { readonly success: false; readonly error: string };


/**
 * Executes a TrustGuard AI investigation using the configured Lamatic flow.
 *
 * Normalises the form data into a Lamatic-compatible payload, calls the flow
 * via the singleton SDK client, and validates the returned JSON against the
 * Zod schema before returning it to the caller.  All errors are caught and
 * surfaced as a typed failure result so the UI never sees an uncaught
 * exception from this action.
 *
 * @param formData - Investigation form data collected from the UI input form.
 * @returns A result object containing either the validated investigation
 *   response (`success: true, data`) or an error message (`success: false, error`).
 */
export async function runInvestigation(
  formData: AnalyzeFormData
): Promise<RunInvestigationResult> {
  try {
    const lamatic = getLamaticClient();
    const flowId = getFlowId();

    const generateInvId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = 'INV-';
      for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const languageMap = {
      Auto: "auto",
      English: "en",
      Hindi: "hi",
      Bengali: "bn",
    } as const;

    const payload = {
      investigation_id: generateInvId(),
      input_type: formData.input_type.toLowerCase(),
      content: formData.content,
      attachment_url: formData.attachment_url || "",
      // language: formData.language === "Auto" ? "auto" : formData.language,
      language: languageMap[formData.language],
      memory_enabled: false,
      tenant_id: "default",
      user_id: "anonymous",
    };

    const response = await lamatic.executeFlow(flowId, payload);

    if (response.status === "success" && response.result) {
      const parsed = InvestigationResponseSchema.safeParse(response.result);

      if (!parsed.success) {
        console.error(
          "[TrustGuard] Lamatic response validation failed:",
          parsed.error
        );
        return {
          success: false,
          error: "Unable to process investigation.",
        };
      }

      return { success: true, data: parsed.data };
    }

    return {
      success: false,
      error: "Unable to process investigation.",
    };
  } catch (err) {
    console.error("[TrustGuard] Investigation error:", err);
    return { success: false, error: "Unable to process investigation." };
  }
}
