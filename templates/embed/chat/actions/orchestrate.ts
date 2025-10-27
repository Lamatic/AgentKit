"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_EMBEDDED_CHAT, "base64").toString("utf8"));


type FlowConfig = {
  name: string
  type?: string
  workflowId: string
  description: string
  mode: "sync" | "async"
  expectedOutput: string | string[]
  inputSchema: Record<string, string>
  outputSchema: Record<string, string>
  polling?: string
  pollInterval?: string
  pollTimeout?: string
  rollback?: {
    name: string
    workflowId: string
    description: string
    mode: "sync" | "async"
    expectedOutput: string | string[]
    inputSchema: Record<string, string>
    outputSchema: Record<string, string>
  }
}

export async function executeWorkflow(
  flowConfig: FlowConfig,
  inputs: Record<string, any>,
): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log(`[v0] Executing workflow: ${flowConfig.name}`)
    console.log(`[v0] Workflow ID: ${flowConfig.workflowId}`)
    console.log(`[v0] Inputs:`, inputs)

    // Map inputs based on schema
    const workflowInput: Record<string, any> = {}
    for (const key of Object.keys(flowConfig.inputSchema)) {
      if (inputs[key] !== undefined) {
        workflowInput[key] = inputs[key]
      }
    }

    console.log(`[v0] Mapped workflow input:`, workflowInput)

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(flowConfig.workflowId, workflowInput)

    console.log(`[v0] Lamatic SDK response:`, response)

    // Handle async workflows that return requestId
    if (flowConfig.mode === "async" && response?.result?.requestId) {
      return {
        success: true,
        data: {
          requestId: response.result.requestId,
          mode: "async",
        },
      }
    }

    // Map outputs based on schema
    const output: Record<string, any> = {}
    const result = response?.result

    if (!result) {
      throw new Error("No result returned from workflow")
    }

    for (const key of Object.keys(flowConfig.outputSchema)) {
      if (result[key] !== undefined) {
        output[key] = result[key]
      }
    }

    console.log(`[v0] Workflow completed successfully:`, output)

    return {
      success: true,
      data: output,
    }
  } catch (error) {
    console.error(`[v0] Error executing workflow ${flowConfig.name}:`, error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Please check your internet connection and try again."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout: The workflow is taking longer than expected. Please try again."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function checkWorkflowStatus(requestId: string): Promise<{
  success: boolean
  status?: any
  error?: string
}> {
  try {
    console.log(`[v0] Checking status for request: ${requestId}`)

    // Use Lamatic SDK to check status
    const status = await lamaticClient.checkStatus(requestId)

    console.log(`[v0] Status check response:`, status)

    return {
      success: true,
      status,
    }
  } catch (error) {
    console.error(`[v0] Error checking workflow status:`, error)

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check status",
    }
  }
}

export async function executePDFIndexation(title: string, url: string) {
  const flowConfig = config.flows.indexation.method1 as FlowConfig
  return executeWorkflow(flowConfig, { title, url })
}

export async function executeWebpageIndexation(urls: string[]) {
  const flowConfig = config.flows.indexation.method2 as FlowConfig
  return executeWorkflow(flowConfig, { urls })
}

export async function executePDFDeletion(title: string) {
  const rollbackConfig = config.flows.indexation.rollback as FlowConfig
  return executeWorkflow(rollbackConfig, { title, type: "pdf", urls: [""] })
}

export async function executeResourceDeletion(title: string, type: string, urls: string[]) {
  const rollbackConfig = config.flows.indexation.rollback as FlowConfig
  return executeWorkflow(rollbackConfig, { title, type, urls })
}
