"use server"

import { lamaticClient } from "../lib/lamatic-client"
import { config } from "../orchestrate.js"

export interface Perspective {
  role: string
  emoji: string
  opinion: string
  reasoning: string
  concerns: string
}

export interface ThinkingResult {
  perspectives: Perspective[]
  final_synthesis: string
  confidence: number
  recommended_action: string
}

export async function simulateThinking(question: string): Promise<{
  success: boolean
  data?: ThinkingResult
  error?: string
}> {
  try {
    const flows = config.flows
    const flowKey = Object.keys(flows)[0]
    const flow = flows[flowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows]

    if (!flow.workflowId) throw new Error("Flow ID not set. Check AGENTIC_THINKING_SIMULATOR_FLOW_ID in .env")

    const resData = await lamaticClient.executeFlow(flow.workflowId, { question })

    const raw = resData?.result ?? resData
    const parsed: ThinkingResult = typeof raw === "string" ? JSON.parse(raw) : raw

    // Extract perspectives - handle both nested and top-level structures
    const perspectives = parsed?.perspectives || parsed?.result?.perspectives
    
    if (!perspectives || !Array.isArray(perspectives)) {
      throw new Error("Invalid response from Lamatic flow")
    }
    
    // Build the final result from whatever structure we have
    const finalResult: ThinkingResult = {
      perspectives,
      final_synthesis: parsed?.final_synthesis || parsed?.result?.final_synthesis || "",
      confidence: parsed?.confidence ?? parsed?.result?.confidence ?? 0,
      recommended_action: parsed?.recommended_action || parsed?.result?.recommended_action || ""
    }

    return { success: true, data: finalResult }
  } catch (error) {
    console.error("[thinking-simulator] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
