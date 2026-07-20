"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate"

function extractValidationError(data: any): string | null {
  if (!data) return null
  const val =
    data?.validationError ||
    data?.result?.validationError ||
    data?.data?.validationError ||
    data?.data?.output?.result?.validationError

  if (!val) return null
  const strVal = typeof val === "string" ? val.trim() : JSON.stringify(val).trim()
  if (["none", "none.", "null", "undefined", ""].includes(strVal.toLowerCase())) {
    return null
  }
  return strVal
}

export async function explainCode(url: string): Promise<{
  success: boolean
  data?: {
    aiResponse: any
    context: any
  }
  error?: string
}> {
  try {
    console.log("[why-this-code] Explaining URL:", url)

    if (!process.env.WHY_THIS_CODE) {
      throw new Error(
        "WHY_THIS_CODE environment variable is not set. Please add it to your .env.local or .env file."
      )
    }

    const flow = config.flows.step1
    if (!flow.workflowId) {
      throw new Error("Workflow not found in config.")
    }

    const inputs = { url }
    console.log("[why-this-code] Sending inputs:", inputs)

    let resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[why-this-code] Response status:", resData?.status)

    const validationError = extractValidationError(resData)
    if (validationError) {
      return {
        success: false,
        error: validationError
      }
    }

    if (resData?.status === "error") {
      const errMsg = resData?.message || resData?.error || "Something went wrong"
      return {
        success: false,
        error: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg)
      }
    }

    // Handle async polling if needed (if Lamatic processes the flow in the background)
    if (resData?.result?.requestId && (!resData?.result?.aiResponse && !resData?.result?.context)) {
      const requestId = resData.result.requestId
      console.log("[why-this-code] Async execution, polling requestId:", requestId)
      const asyncResult = await lamaticClient.checkStatus(requestId, 2, 60)

      const asyncValidationError = extractValidationError(asyncResult)
      if (asyncValidationError) {
        return {
          success: false,
          error: asyncValidationError
        }
      }

      if (asyncResult?.status === "error") {
        const errMsg = asyncResult?.message || asyncResult?.error || "Something went wrong"
        return {
          success: false,
          error: typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg)
        }
      }
      resData = asyncResult
    }

    // Extract outputs from the response result
    const aiResponse =
      resData?.result?.aiResponse ||
      (resData as any)?.data?.output?.result?.aiResponse ||
      resData?.aiResponse ||
      (resData as any)?.data?.aiResponse

    const context =
      resData?.result?.context ||
      (resData as any)?.data?.output?.result?.context ||
      resData?.context ||
      (resData as any)?.data?.context

    if (!aiResponse || !context) {
      console.log("[why-this-code] Raw result body for debugging:", JSON.stringify(resData))
      const valErr = extractValidationError(resData)
      const fallbackErr = valErr || resData?.message || resData?.error || "Something went wrong"
      return {
        success: false,
        error: typeof fallbackErr === "string" ? fallbackErr : JSON.stringify(fallbackErr)
      }
    }

    return {
      success: true,
      data: {
        aiResponse,
        context
      }
    }
  } catch (error) {
    console.error("[why-this-code] Execution error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong"
    }
  }
}
