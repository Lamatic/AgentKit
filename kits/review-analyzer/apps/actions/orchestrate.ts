"use server"

import { lamaticClient } from "@/lib/lamatic-client"

const FLOW_ID = process.env.REVIEW_ANALYZER_FLOW_ID

export async function analyzeReviews(
  reviews: string[]
): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    if (!FLOW_ID) {
      throw new Error("REVIEW_ANALYZER_FLOW_ID environment variable is not set")
    }

    console.log("[Review Analyzer] Invoking flow with reviews count:", reviews.length)

    const inputs: Record<string, any> = { reviews }

    console.log("[Review Analyzer] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(FLOW_ID, inputs)
    console.log("[Review Analyzer] Raw response:", resData)

    const result = resData?.result?.result

    if (!result) {
      throw new Error("No analysis result found in response")
    }

    return {
      success: true,
      data: result as string,
    }
  } catch (error) {
    console.error("[Review Analyzer] Error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic AI. Please check your internet connection."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please verify your API credentials."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
