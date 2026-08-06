"use server";

import lamaticConfig from "../../lamatic.config";
import { executePromptAnalysis } from "@/lib/lamatic-client";
import {
  ApiResponse,
  PromptAnalysisInput,
} from "@/types";

/**
 * Sends a prompt to the Lamatic Prompt Attack Detection Agent
 * and returns the security analysis.
 */
export async function analyzePrompt(
  input: PromptAnalysisInput
): Promise<ApiResponse> {
  try {
    if (!input.prompt.trim()) {
      return {
        success: false,
        error: "Prompt cannot be empty.",
      };
    }

    const result = await executePromptAnalysis(input);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred.",
    };
  }
}