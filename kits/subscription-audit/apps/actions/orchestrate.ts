"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import {config} from "../orchestrate.js"

export async function processStatement(
  statement_text: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log("[v0] Processing statement of length:", statement_text.length)

    // Get the first workflow from the config
    const flows = config.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    const flow = flows[firstFlowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows];
    console.log("[v0] Using workflow:", flow.name, flow.workflowId);

    // Prepare inputs based on the flow's input schema
    const inputs: Record<string, any> = {
      statement_text,
    }

    console.log("[v0] Sending inputs to flow...")

    if(!flow.workflowId){
      throw Error("Workflow not found in config.")
    }
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Raw response:", resData)

    if (resData?.status === 'error' || resData?.statusCode >= 400) {
      throw new Error(resData.message || `API Error: ${resData.statusCode}`)
    }

    // Extract the subscriptions from the response safely
    let subscriptions = null;
    if (Array.isArray(resData?.result?.subscriptions)) {
      subscriptions = resData.result.subscriptions;
    } else if (Array.isArray((resData as any)?.subscriptions)) {
      subscriptions = (resData as any).subscriptions;
    } else if (Array.isArray(resData?.result)) {
      subscriptions = resData.result;
    }

    if (!subscriptions) {
      throw new Error("No subscriptions found in response")
    }

    return {
      success: true,
      data: { subscriptions },
    }
  } catch (error) {
    console.error("[v0] Generation error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to the service. Please check your internet connection and try again."
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
