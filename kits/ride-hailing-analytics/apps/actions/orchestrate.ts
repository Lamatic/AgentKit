"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "../../lamatic.config"

export type QueryResultRow = Record<string, string | number | null>

export async function askQuestion(
  question: string,
  sessionId: string,
): Promise<{
  success: boolean
  data?: {
    answer: string
    chartType: string
    sql: string
    results: QueryResultRow[]
  }
  error?: string
}> {
  try {
    const flows = config.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    const flow = flows[firstFlowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows]

    if (!flow.workflowId) {
      throw new Error("Workflow not found in config.")
    }

    const inputs = {
      question,
      sessionId,
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    const answer = resData?.result?.answer
    const chartType = resData?.result?.chartType ?? "none"
    const sql = resData?.result?.sql ?? ""
    const results = resData?.result?.results ?? []

    if (!answer) {
      throw new Error("No answer found in response")
    }

    return {
      success: true,
      data: { answer, chartType, sql, results },
    }
  } catch (error) {
    console.error("Query error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to the service. Please check your internet connection and try again."
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
