"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "../config.json"

type FlowConfig = {
  name: string
  workflowId: string
}

type GenerateContentResult = {
  success: boolean
  data?: unknown
  error?: string
}

const flows = config.flows as Record<string, FlowConfig>

export async function generateContent(
  prUrl: string
): Promise<GenerateContentResult> {
  try {
    const [firstFlowKey] = Object.keys(flows)

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration.")
    }

    const flow = flows[firstFlowKey]

    if (!flow?.workflowId) {
      throw new Error("Workflow not found in config.")
    }

    const workflowId = process.env[flow.workflowId]

    if (!workflowId) {
      throw new Error(
        `Missing environment variable for workflow ID key: ${flow.workflowId}`
      )
    }

    const response = await lamaticClient.executeFlow(workflowId, { prUrl })

    return {
      success: true,
      data: response?.result ?? null,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred."

    return {
      success: false,
      error: message,
    }
  }
}
