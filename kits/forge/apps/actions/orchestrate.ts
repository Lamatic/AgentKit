"use server"

import { getLamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

type FlowName = "pricing" | "tradeoff" | "contract" | "invoice";

export async function runForgeFlow(
  flowName: FlowName,
  inputs: Record<string, string>
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    const flow = config.flows[flowName];

    if (!flow || !flow.workflowId) {
      throw new Error(`Flow "${flowName}" not found in configuration`)
    }

    const client = getLamaticClient();
    const resData = await client.executeFlow(flow.workflowId, inputs)

    return {
      success: true,
      data: resData?.result || resData,
    }
  } catch (error) {
    console.error(`[Forge] ${flowName} flow error:`, error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic. Please check your internet connection."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please check your API configuration."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
