"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_SHEETS, "base64").toString("utf8"));


type SchemaToType<T> = {
  [K in keyof T]: T[K] extends "string"
    ? string
    : T[K] extends "number"
      ? number
      : T[K] extends "boolean"
        ? boolean
        : T[K] extends "object"
          ? Record<string, unknown>
          : never
}

type AIProcessingInput = SchemaToType<typeof config.flows.analysis.inputSchema>

const aiFlow = config.flows.analysis

export async function executeAIProcessing(input: AIProcessingInput): Promise<{
  success: boolean
  requestId?: string
  error?: string
}> {
  try {
    console.log("Executing AI processing with Lamatic SDK")
    console.log("Input:", input)

    // Prepare workflow input based on config schema
    const workflowInput = Object.keys(config.flows.analysis.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof AIProcessingInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    // Include data and outputFormat in workflow input
    workflowInput.data = input.data
    workflowInput.outputFormat = input.outputFormat

    console.log("Workflow input:", workflowInput)

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(aiFlow.workflowId, workflowInput)

    console.log("Lamatic SDK response:", response)

    const requestId = response?.result?.requestId || response?.requestId || response?.id

    if (!requestId) {
      console.error("Response structure:", JSON.stringify(response, null, 2))
      throw new Error("No requestId returned from workflow")
    }

    console.log("AI processing initiated with requestId:", requestId)

    return {
      success: true,
      requestId,
    }
  } catch (error) {
    console.error("Error executing AI processing:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Please check your internet connection and try again."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout: The AI processing is taking longer than expected. Please try again."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
