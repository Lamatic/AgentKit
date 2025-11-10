"use server"

import { lamaticClient, generationConfig } from "@/lib/lamatic-client"

type InputType = "text" | "image" | "json"

export async function generateContent(
  inputType: InputType,
  instructions: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log("[v0] Generating content with:", { inputType, instructions })

    // Get the first workflow from the config
    const flows = generationConfig.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    const flow = flows[firstFlowKey]
    console.log("[v0] Using workflow:", flow.name, flow.workflowId)

    // Prepare inputs based on the flow's input schema
    const inputs: Record<string, any> = {
      mode: inputType,
      instructions,
    }

    // Map to schema if needed
    for (const inputKey of Object.keys(flow.inputSchema || {})) {
      if (inputKey === "inputType" || inputKey === "type") {
        inputs[inputKey] = inputType
      } else if (inputKey === "instructions" || inputKey === "query") {
        inputs[inputKey] = instructions
      }
    }

    console.log("[v0] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Raw response:", resData)

    // Parse the answer from resData?.output.answer
    const answer = resData?.result?.answer

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
