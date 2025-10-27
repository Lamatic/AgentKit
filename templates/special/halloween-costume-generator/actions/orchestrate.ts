"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_HALLOWEEN, "base64").toString("utf8"));


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
type CostumeDesignerInput = SchemaToType<typeof config.flows.costume_designer.inputSchema>

const aiFlow = config.flows.image_generation
const costumeDesignerFlow = config.flows.costume_designer

export async function executeAIProcessing(input: AIProcessingInput): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!input.image || !input.theme) {
      throw new Error("Missing required input: image and theme are required")
    }

    console.log("[v0] Executing AI processing with Lamatic SDK")

    const workflowInput = Object.keys(config.flows.image_generation.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof AIProcessingInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(aiFlow.workflowId, workflowInput)

    if (!response) {
      throw new Error("No response returned from workflow")
    }

    console.log("[v0] AI processing completed successfully")

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error("[v0] Error executing AI processing:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Please check your internet connection and try again."
      } else if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout: The AI processing is taking longer than expected. Please try again."
      } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
        errorMessage = "Server error: The Lamatic service is temporarily unavailable. Please try again in a moment."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export async function executeCostumeDesigner(input: CostumeDesignerInput): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  try {
    if (!input.image || !input.page) {
      throw new Error("Missing required input: image and page are required")
    }

    console.log("[v0] Executing Costume Designer with Lamatic SDK")

    const workflowInput = Object.keys(config.flows.costume_designer.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof CostumeDesignerInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(costumeDesignerFlow.workflowId, workflowInput)

    if (!response) {
      throw new Error("No response returned from workflow")
    }

    console.log("[v0] Costume Designer processing completed successfully")

    return {
      success: true,
      data: response,
    }
  } catch (error) {
    console.error("[v0] Error executing Costume Designer:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Please check your internet connection and try again."
      } else if (error.message.includes("API key") || error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout: The AI processing is taking longer than expected. Please try again."
      } else if (error.message.includes("500") || error.message.includes("502") || error.message.includes("503")) {
        errorMessage = "Server error: The Lamatic service is temporarily unavailable. Please try again in a moment."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
