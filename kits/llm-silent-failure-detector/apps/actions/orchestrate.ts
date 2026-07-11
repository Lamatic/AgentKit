"use server"

import { lamaticClient, FLOW_ID } from "@/lib/lamatic-client"

export type LogEntry = {
  id: string
  prompt: string
  context: string
  response: string
  expected_schema?: Record<string, unknown>
}

export type FailureMode = {
  name: string
  count: number
  examples: string[]
  description: string
  suggested_direction: string
}

export type DetectionReport = {
  summary: {
    total_logs: number
    flagged: number
    clusters: number
  }
  failure_modes: FailureMode[]
}

type ActionResult =
  | { success: true; data: DetectionReport }
  | { success: false; error: string }

export async function detectSilentFailures(logs: LogEntry[]): Promise<ActionResult> {
  try {
    if (!Array.isArray(logs) || logs.length === 0) {
      return { success: false, error: "Provide at least one log entry." }
    }

    const resData = await lamaticClient.executeFlow(FLOW_ID, { logs })

    // The flow's API Response node returns the report directly under `result`.
    const report = resData?.result?.result as DetectionReport | undefined

    if (!report || !report.summary || !Array.isArray(report.failure_modes)) {
      throw new Error("Unexpected response shape from the flow.")
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("[detectSilentFailures] error:", error)

    let message = "Unknown error occurred."
    if (error instanceof Error) {
      message = error.message
      if (message.includes("fetch failed")) {
        message = "Network error: could not reach the Lamatic API. Check your connection and credentials."
      } else if (message.toLowerCase().includes("api key") || message.toLowerCase().includes("unauthorized")) {
        message = "Authentication error: check LAMATIC_API_KEY and LAMATIC_PROJECT_ID in your .env.local."
      }
    }

    return { success: false, error: message }
  }
}
