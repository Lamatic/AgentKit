"use server"

import { lamaticClient } from "@/lib/lamatic-client"

const FLOW_ID = process.env.REDDIT_SCOUT_FLOW_ID

export async function searchReddit(
  query: string,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!FLOW_ID) {
      throw new Error("REDDIT_SCOUT_FLOW_ID environment variable is not set")
    }

    console.log("[v0] Searching Reddit for:", query)

    const inputs: Record<string, any> = { query }

    console.log("[v0] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(FLOW_ID, inputs)
    console.log("[v0] Raw response:", resData)

    const answer = resData?.result?.answer

    if (!answer) {
      throw new Error("No answer found in response")
    }

    return {
      success: true,
      data: answer,
    }
  } catch (error) {
    console.error("[v0] Reddit Scout error:", error)

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
