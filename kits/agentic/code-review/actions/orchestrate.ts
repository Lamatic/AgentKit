"use server"

import { lamaticClient } from "@/lib/lamatic-client"

+export async function generateContent(
+  prUrl: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log("[v0] Generating content with:", { prUrl })

    // Get the first workflow from the config
    const flows = config.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    // Fix: Add index signature to make TypeScript happy about accessing flows[firstFlowKey]
    const flow = flows[firstFlowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows];
    console.log("[v0] Using workflow:", flow.name, flow.workflowId);

   const inputs: Record<string, any> = { prUrl }
    console.log("[v0] Sending inputs:", inputs)

    if(!flow.workflowId){
      throw Error("Workflow not found in config.")
    }
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Raw response:", resData)

    const answer = data?.data?.executeWorkflow?.result

    if (!answer) {
      throw new Error("No answer found in response")
    }

    return {
      success: true,
      data: answer,
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
