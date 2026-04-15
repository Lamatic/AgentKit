"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import {config} from "../orchestrate"

function summarizeMessage(message: unknown): string | undefined {
  if (typeof message !== "string") {
    return undefined
  }

  const trimmed = message.replace(/\s+/g, " ").trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}...` : trimmed
}

function normalizePayload(payload: unknown): string {
  if (payload === null) {
    return "null"
  }
  if (payload === undefined) {
    return ""
  }
  if (typeof payload === "string") {
    return payload
  }

  return JSON.stringify(payload)
}

export async function sendMedicalQuery(
  query: string,
): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  let correlationId: string | undefined
  try {
    console.log("[medical-assistant] Processing query, length:", query.length)

    if (!process.env.MEDICAL_ASSISTANT_CHAT) {
      throw new Error(
        "MEDICAL_ASSISTANT_CHAT environment variable is not set. Please add it to your .env.local file."
      )
    }

    // Get the first workflow from the config
    const flows = config.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    const flow = flows[firstFlowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows];
    console.log("[medical-assistant] Using workflow:", flow.name, flow.workflowId);

    // Prepare inputs based on the flow's input schema
    const inputs: Record<string, any> = {
      query,
    }

    // Map to schema if needed
    for (const inputKey of Object.keys(flow.inputSchema || {})) {
      if (inputKey === "query" || inputKey === "question" || inputKey === "message") {
        inputs[inputKey] = query
      }
    }

    console.log("[medical-assistant] Sending inputs for workflow:", flow.workflowId)

    if(!flow.workflowId){
      throw new Error("Workflow not found in config.")
    }
    let resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[medical-assistant] Response received, status:", resData?.status)

    // Check for API-level errors first
    if (resData?.status === "error") {
      const apiError = resData?.message || "Unknown workflow error"
      throw new Error(`Lamatic workflow error: ${apiError}. Please check your workflow configuration on the Lamatic dashboard.`)
    }

    // Handle async response - if we get a requestId, poll for the result
    if (resData?.result?.requestId && !resData?.result?.answer) {
      const requestId = resData.result.requestId
      correlationId = requestId
      console.log("[medical-assistant] Async response, polling with requestId:", requestId)
      
      const pollStartedAt = Date.now()
      const asyncResult = await lamaticClient.checkStatus(requestId, 2, 60)
      const durationMs = Date.now() - pollStartedAt
      console.log("[medical-assistant] Async poll metadata:", {
        requestId,
        status: asyncResult?.status,
        statusCode: (asyncResult as any)?.statusCode ?? (asyncResult as any)?.code,
        durationMs,
        message: summarizeMessage(asyncResult?.message),
      })

      if (asyncResult?.status === "error") {
        throw new Error(`Workflow execution failed: ${asyncResult?.message || "Unknown error"}`)
      }

      resData = asyncResult
    }

    // Parse the answer - handle multiple response structures
    const rawAnswer = resData?.result?.answer 
      || (resData as any)?.data?.output?.result?.answer
      || resData?.result?.output?.answer
      || (typeof resData?.result === "string" ? resData.result : null)

    // If the answer is an object (LLM output), extract the generatedResponse text
    let answer: string | null = null
    if (typeof rawAnswer === "object" && rawAnswer !== null) {
      answer = rawAnswer.generatedResponse || rawAnswer.text || rawAnswer.content || JSON.stringify(rawAnswer)
    } else if (typeof rawAnswer === "string" && rawAnswer.length > 0) {
      answer = rawAnswer
    }

    const normalizedAnswer = normalizePayload(answer ?? rawAnswer)
    console.log("[medical-assistant] Parsed answer:", normalizedAnswer ? `[${normalizedAnswer.length} chars]` : "null")

    if (!normalizedAnswer) {
       throw new Error("No answer found in response. Check workflow output configuration.")
    }

    return {
      success: true,
      data: normalizedAnswer,
    }
  } catch (error) {
    const errorMeta = {
      correlationId: (error as any)?.requestId ?? correlationId,
      name: (error as any)?.name,
      statusCode: (error as any)?.statusCode ?? (error as any)?.code,
      message: summarizeMessage((error as any)?.message),
    }
    console.error("[medical-assistant] Query error metadata:", errorMeta)

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
