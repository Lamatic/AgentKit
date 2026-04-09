"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";

const TIMEOUT_MS = 300000; // 5 minutes (Matching Vercel Hobby maxDuration)

/**
 * Wraps a promise with a timeout.
 * @param promise The promise to wrap.
 * @param timeoutMs Timeout in milliseconds.
 * @param errorMessage Message to throw on timeout.
 * @returns The original promise result or throws a timeout error.
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Executes the Lamatic analyze flow to generate a Founder Brief.
 * @param idea The startup idea to analyze.
 * @param userId Unique user identifier for session persistence.
 * @param sessionId Unique session identifier for the analysis.
 * @returns Object containing success status, generated brief, and idea decomposition.
 */
export async function analyzeIdea(
  idea: string,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; brief?: string; decomposition?: string; error?: string }> {
  try {
    const flow = config.flows.analyze;
    if (!flow.workflowId) throw new Error("FOUNDER_LENS_ANALYZE_FLOW_ID is not set.");
    
    // Wrap the flow execution in a timeout
    const resData: any = await withTimeout(
      lamaticClient.executeFlow(flow.workflowId, { idea, userId, sessionId }),
      TIMEOUT_MS,
      "The AI provider is taking longer than usual to respond. This usually means their service is overloaded. Please try again in a few minutes."
    );

    const brief = resData?.result?.brief;
    if (!brief) throw new Error("No brief returned from analyze flow.");
    return { success: true, brief, decomposition: resData?.result?.decomposition };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Sends a chat message to the RAG-powered Lamatic chat flow.
 * @param message The user's follow-up question.
 * @param userId Unique user identifier.
 * @param sessionId Unique session identifier.
 * @returns Object containing the assistant's answer.
 */
export async function chatWithBrief(
  message: string,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const flow = config.flows.chat;
    if (!flow.workflowId) throw new Error("FOUNDER_LENS_CHAT_FLOW_ID is not set.");
    const resData: any = await withTimeout(
      lamaticClient.executeFlow(flow.workflowId, { message, userId, sessionId }),
      90000, // 90 second timeout for chat
      "The AI Analyst is taking too long to respond. Please try a shorter question or try again later."
    );
    const answer = resData?.result?.answer;
    if (!answer) throw new Error("No answer returned from chat flow.");
    return { success: true, answer };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
