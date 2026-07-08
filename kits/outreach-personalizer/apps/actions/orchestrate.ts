"use server"

import { getLamaticClient } from "../lib/lamatic-client";
import kitConfig from "../../lamatic.config";

export interface PitchInput {
  company_url: string;
  founder_linkedin_url: string;
  candidate_context: string;
}

const TIMEOUT_MS = 300000; // 5 minutes (Matching Vercel Hobby maxDuration)

/**
 * Wraps a promise with a timeout.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    // Ensure node can exit if the timer is the only thing keeping it alive
    if (timer.unref) {
      timer.unref();
    }
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export async function generatePersonalizedPitch(input: PitchInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    console.log("[v0] Executing Average Teenager flow for company URL:", input.company_url);

    const flowStep = kitConfig.steps.find((step) => step.id === "average-teenager");
    if (!flowStep) {
      throw new Error("Step 'average-teenager' not defined in lamatic.config.");
    }
    const envKey = flowStep.envKey || "FLOW_ID";
    const flowId = process.env[envKey];
    if (!flowId) {
      throw new Error(`${envKey} is not set in environment variables.`);
    }

    const trimmedInput = {
      company_url: input.company_url.trim(),
      founder_linkedin_url: input.founder_linkedin_url.trim(),
      candidate_context: input.candidate_context.trim(),
    };

    const resData: any = await withTimeout(
      getLamaticClient().executeFlow(flowId, trimmedInput),
      TIMEOUT_MS,
      "The AI provider is taking longer than usual to respond. This usually means their service is overloaded. Please try again in a few minutes."
    );

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
