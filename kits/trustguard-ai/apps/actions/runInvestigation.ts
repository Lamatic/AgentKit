"use server";
// actions/runInvestigation.ts
// Next.js Server Action — calls the TrustGuard AI Lamatic flow.
// NEVER imports client-only code. Uses server-only env vars.

import { getLamaticClient, getFlowId } from "@/lib/lamatic";
import type { AnalyzeFormData, InvestigationResponse } from "@/types/response";

export interface RunInvestigationResult {
  success: boolean;
  data?: InvestigationResponse;
  error?: string;
}

export async function runInvestigation(
  formData: AnalyzeFormData
): Promise<RunInvestigationResult> {
  try {
    const lamatic = getLamaticClient();
    const flowId = getFlowId();

    const payload = {
      input_type: formData.input_type.toLowerCase(),
      content: formData.content,
      attachment_url: formData.attachment_url || "",
      language: formData.language === "Auto" ? "auto" : formData.language,
      memory_enabled: false,
      tenant_id: "default",
      user_id: "anonymous",
    };

    const response = await lamatic.executeFlow(flowId, payload);

    if (response.status === "success" && response.result) {
      return { success: true, data: response.result as InvestigationResponse };
    }

    return {
      success: false,
      error: response.message || "Analysis failed. Please try again.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }
}
