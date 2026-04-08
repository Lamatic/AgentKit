"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "../../lamatic.config"

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

    // Get the flow ID from lamatic.config.ts steps → envKey → env var
    const step = config.steps[0]
    if (!step?.envKey) {
      throw new Error("No flow step found in lamatic.config.ts")
    }

    const workflowId = process.env[step.envKey]
    if (!workflowId) {
      throw new Error(`Flow ID not set. Add ${step.envKey} to your .env.local file.`)
    }

    console.log("[v0] Using workflow:", step.id, workflowId)

    const inputs: Record<string, any> = {
      mode: inputType,
      instructions,
    }

    console.log("[v0] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(workflowId, inputs)
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
