"use server"

import { lamaticClient } from "@/lib/lamatic-client"

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

    const flowId = process.env.LAMATIC_FLOW_ID
    if (!flowId) {
      throw new Error("LAMATIC_FLOW_ID is not configured")
    }

    // Prepare inputs based on the API trigger schema
    const inputs: Record<string, any> = {
      message: instructions,
    }

    console.log("[v0] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(flowId, inputs)
    console.log("[v0] Raw response:", resData)

    // Parse the answer from resData
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
