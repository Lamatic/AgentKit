"use server"

import { lamaticClient } from "../lib/lamatic-client";

export interface PitchInput {
  company_url: string;
  founder_linkedin_url: string;
  candidate_context: string;
}

export async function generatePersonalizedPitch(input: PitchInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    console.log("[v0] Executing Average Teenager flow with:", input);

    const flowId = process.env.FLOW_ID;
    if (!flowId) {
      throw new Error("FLOW_ID is not set in environment variables.");
    }

    const trimmedInput = {
      company_url: input.company_url.trim(),
      founder_linkedin_url: input.founder_linkedin_url.trim(),
      candidate_context: input.candidate_context.trim(),
    };

    const resData: any = await lamaticClient.executeFlow(flowId, trimmedInput);
    console.log("[v0] Raw SDK response:", JSON.stringify(resData, null, 2));

    if (!resData || (resData.status && resData.status === "error")) {
      throw new Error(resData.message || "Flow execution failed or returned no result.");
    }

    return {
      success: true,
      data: resData.result,
    };
  } catch (error: any) {
    console.error("[v0] Generation error:", error);

    let errorMessage = "An unexpected error occurred during execution.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to the Lamatic service. Please check your internet connection.";
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
