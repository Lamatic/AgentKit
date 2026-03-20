"use server";

import { runApplyBudFlow, ApplyBudResponse } from "@/lib/lamatic-client";

export interface OrchestrateInput {
  resume: string;
  job_urls: string[];
}

export interface OrchestrateResult {
  success: boolean;
  data?: ApplyBudResponse;
  error?: string;
}

export async function orchestrate(
  input: OrchestrateInput
): Promise<OrchestrateResult> {
  if (!input.resume || input.resume.trim().length < 50) {
    return {
      success: false,
      error: "Resume text is too short. Please paste your full resume.",
    };
  }

  if (!input.job_urls || input.job_urls.length === 0) {
    return {
      success: false,
      error: "Please provide at least one job posting URL.",
    };
  }

  const validUrls = input.job_urls.filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return {
      success: false,
      error: "No valid URLs found. Please check your job posting URLs.",
    };
  }

  try {
    const result = await runApplyBudFlow({
      resume: input.resume.trim(),
      job_urls: validUrls,
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
    };
  }
}
