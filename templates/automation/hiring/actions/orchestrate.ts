"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_HIRING, "base64").toString("utf8"));

type SchemaToType<T> = {
  [K in keyof T]: T[K] extends "string"
    ? string
    : T[K] extends "number"
      ? number
      : T[K] extends "boolean"
        ? boolean
        : never
}

type AnalysisInput = SchemaToType<typeof config.flows.analysis.inputSchema>
type AnalysisOutput = SchemaToType<typeof config.flows.analysis.outputSchema>

const analysisFlow = config.flows.analysis

export async function executeHiringAnalysis(input: AnalysisInput): Promise<{
  success: boolean
  result?: AnalysisOutput & { input: { name: string; email: string } }
  error?: string
}> {
  try {
    console.log("[v0] Executing hiring analysis with Lamatic SDK")
    console.log("[v0] Input:", input)

    const workflowInput = Object.keys(config.flows.analysis.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof AnalysisInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    // Execute the workflow using Lamatic SDK
    const response = await lamaticClient.executeFlow(analysisFlow.workflowId, workflowInput)

    console.log("[v0] Lamatic SDK response:", response)

    const result = response?.result?.output

    if (!result) {
      throw new Error("No result returned from workflow")
    }

    const output = Object.keys(config.flows.analysis.outputSchema).reduce((acc, key) => {
      acc[key as keyof AnalysisOutput] =
        result[key] ||
        (config.flows.analysis.outputSchema[key as keyof typeof config.flows.analysis.outputSchema] === "number"
          ? 0
          : "")
      return acc
    }, {} as AnalysisOutput)

    console.log("[v0] Analysis completed successfully:", output)

    return {
      success: true,
      result: {
        ...output,
        input: {
          name: input.name,
          email: input.email,
        },
      },
    }
  } catch (error) {
    console.error("[v0] Error executing hiring analysis:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      // Provide more specific error messages for common issues
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Please check your internet connection and try again."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please check your LAMATIC_API_KEY configuration."
      } else if (error.message.includes("timeout")) {
        errorMessage = "Request timeout: The analysis is taking longer than expected. Please try again."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
