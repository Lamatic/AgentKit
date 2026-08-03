"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "../../lamatic.config"

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
    const steps = config.steps
    const firstStep = steps[0]

    if (!firstStep) {
      throw new Error("No workflows found in configuration")
    }

    const workflowId = process.env[firstStep.envKey];
    console.log("[v0] Using workflow ID:", workflowId);

    // Prepare inputs based on the flow's input schema
    const inputs: Record<string, any> = {
      statement_text,
    }

    console.log("[v0] Sending inputs to flow...")

    if(!workflowId){
      throw Error("Workflow not found in config.")
    }
    const resData = await lamaticClient.executeFlow(workflowId, inputs)
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

    const validSubscriptions = subscriptions.filter((sub: any) => 
      sub && typeof sub === 'object' &&
      typeof sub.merchant === 'string' &&
      typeof sub.amount === 'string' &&
      typeof sub.frequency === 'string' &&
      typeof sub.verdict === 'string' &&
      typeof sub.reason === 'string'
    );

    if (validSubscriptions.length === 0 && subscriptions.length > 0) {
      throw new Error("Subscriptions were found but did not match the expected schema");
    }

    return {
      success: true,
      data: { subscriptions: validSubscriptions },
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
