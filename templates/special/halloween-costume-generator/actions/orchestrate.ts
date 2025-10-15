"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "@/lamatic-config.json"

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

type AIProcessingInput = SchemaToType<typeof config.flows.image_generation.inputSchema>

const aiFlow = config.flows.image_generation

export async function executeAIProcessing(input: AIProcessingInput): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    console.log("Executing AI processing with Lamatic SDK")
    console.log("Input:", input)

    const workflowInput = Object.keys(config.flows.image_generation.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof AIProcessingInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    console.log("Workflow input:", workflowInput)

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(aiFlow.workflowId, workflowInput)

    console.log("Lamatic SDK response:", response)

    if (!response) {
      throw new Error("No response returned from workflow")
    }

    console.log("AI processing completed successfully")

    return {
      success: true,
      data: response,
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
