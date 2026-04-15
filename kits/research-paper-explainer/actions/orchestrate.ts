"use server"

import { lamaticClient } from "@/lib/lamatic-client"

const EXPLAIN_FLOW_ID = process.env.LAMATIC_FLOW_ID ?? ""
const QUIZ_FLOW_ID = process.env.QUIZ_FLOW_ID ?? ""

export async function explainPaper(
  paperContent: string,
  level: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    console.log("[explain] Calling flow:", EXPLAIN_FLOW_ID)

    // Step 1 - trigger the flow
    const resData = await lamaticClient.executeFlow(EXPLAIN_FLOW_ID, {
      paperContent,
      level,
    }) as any

    console.log("[explain] Initial response:", JSON.stringify(resData))

    // Step 2 - if async, poll using checkStatus
    const requestId = resData?.result?.requestId || resData?.requestId
    if (requestId) {
      console.log("[explain] Polling for requestId:", requestId)
      // poll every 3 seconds, timeout after 60 seconds
      const pollData = await lamaticClient.checkStatus(requestId, 3, 60) as any
      console.log("[explain] Poll result:", JSON.stringify(pollData))

      const explanation =
        pollData?.data?.output?.result?.generatedResponse ||
        pollData?.data?.output?.generatedResponse ||
        pollData?.result?.generatedResponse ||
        pollData?.generatedResponse ||
        (typeof pollData === "string" && pollData.length > 10 ? pollData : null)

      if (explanation) return { success: true, data: explanation }
      throw new Error("No explanation in poll result: " + JSON.stringify(pollData))
    }

    // Realtime response
    const explanation =
      resData?.result?.generatedResponse ||
      resData?.generatedResponse ||
      (typeof resData?.result === "string" ? resData.result : null)

    if (explanation) return { success: true, data: explanation }
    throw new Error("Empty response: " + JSON.stringify(resData))

  } catch (error) {
    console.error("[explain] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function generateQuiz(
  paperContent: string,
  numQuestions: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log("[quiz] Calling flow:", QUIZ_FLOW_ID)

    const resData = await lamaticClient.executeFlow(QUIZ_FLOW_ID, {
      paperContent,
      numQuestions: String(numQuestions),
    }) as any

    console.log("[quiz] Initial response:", JSON.stringify(resData))

    const requestId = resData?.result?.requestId || resData?.requestId
    if (requestId) {
      const pollData = await lamaticClient.checkStatus(requestId, 3, 60) as any
      console.log("[quiz] Poll result:", JSON.stringify(pollData))

      const raw =
        pollData?.data?.output?.result?.generatedResponse ||
        pollData?.data?.output?.generatedResponse ||
        pollData?.result?.generatedResponse ||
        pollData?.generatedResponse

      if (raw) {
        const match = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null
        const parsed = match ? JSON.parse(match[0]) : raw
        return { success: true, data: parsed }
      }
      throw new Error("No quiz in poll result")
    }

    const raw = resData?.result?.generatedResponse || resData?.generatedResponse
    if (raw) {
      const match = typeof raw === "string" ? raw.match(/\{[\s\S]*\}/) : null
      const parsed = match ? JSON.parse(match[0]) : raw
      return { success: true, data: parsed }
    }

    throw new Error("Empty quiz response")
  } catch (error) {
    console.error("[quiz] Error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}