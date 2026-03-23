"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import { config } from "../orchestrate.js";

export async function analyzeIdea(
  idea: string,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; brief?: string; decomposition?: string; error?: string }> {
  try {
    const flow = config.flows.analyze;
    if (!flow.workflowId) throw new Error("FOUNDER_LENS_ANALYZE_FLOW_ID is not set.");
    const resData = await lamaticClient.executeFlow(flow.workflowId, { idea, userId, sessionId });
    const brief = resData?.result?.brief;
    if (!brief) throw new Error("No brief returned from analyze flow.");
    return { success: true, brief, decomposition: resData?.result?.decomposition };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function chatWithBrief(
  message: string,
  userId: string,
  sessionId: string
): Promise<{ success: boolean; answer?: string; error?: string }> {
  try {
    const flow = config.flows.chat;
    if (!flow.workflowId) throw new Error("FOUNDER_LENS_CHAT_FLOW_ID is not set.");
    const resData = await lamaticClient.executeFlow(flow.workflowId, { message, userId, sessionId });
    const answer = resData?.result?.answer;
    if (!answer) throw new Error("No answer returned from chat flow.");
    return { success: true, answer };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
