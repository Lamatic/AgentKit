"use server"

import { lamaticClient } from "@/lib/lamatic-client"

const FLOW_ID = process.env.GITHUB_COMMIT_AGENT_FLOW_ID

export async function runCommitAgent(
  message: string,
): Promise<{
  success: boolean
  data?: {
    summary: string
    compared: string
  }
  error?: string
}> {
  try {
    if (!FLOW_ID) {
      throw new Error("GITHUB_COMMIT_AGENT_FLOW_ID environment variable is not set")
    }

    console.log("[v0] Running Commit Agent for message:", message)

    const inputs: Record<string, any> = { message }

    console.log("[v0] Sending inputs to Lamatic:", inputs)

    const resData = await lamaticClient.executeFlow(FLOW_ID, inputs)
    console.log("[v0] Raw response:", resData)

    const summary = resData?.result?.summary
    const compared = resData?.result?.compared

    if (!summary) {
      throw new Error("No summary returned from response. Ensure your model is configured correctly.")
    }

    return {
      success: true,
      data: {
        summary,
        compared: compared || ""
      },
    }
  } catch (error) {
    console.error("[v0] Commit Agent error:", error)

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
