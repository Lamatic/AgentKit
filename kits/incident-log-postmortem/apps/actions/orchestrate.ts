"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

export async function analyzeIncident(
  logs: string,
  serviceName: string,
  recentDeployTime: string,
): Promise<{
  success: boolean
  data?: string
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
      logs,
      serviceName,
      recentDeployTime,
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    const postmortem = resData?.result?.postmortem

    if (!postmortem) {
      throw new Error("No postmortem found in response")
    }

    return {
      success: true,
      data: postmortem,
    }
  } catch (error) {
    console.error("Analysis error:", error)

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