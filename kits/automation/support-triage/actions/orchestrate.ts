"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

type SchemaToType<T> = {
  [K in keyof T]: T[K] extends "string"
    ? string
    : T[K] extends "number"
      ? number
      : T[K] extends "boolean"
        ? boolean
        : never
}

type SupportTriageInput = SchemaToType<typeof config.flows.supportTriage.inputSchema>
type SupportTriageOutput = SchemaToType<typeof config.flows.supportTriage.outputSchema>

const supportTriageFlow = config.flows.supportTriage

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value
  }

  if (typeof value === "string") {
    return value.toLowerCase() === "true"
  }

  return false
}

export async function executeSupportTriage(
  input: SupportTriageInput,
): Promise<{
  success: boolean
  result?: SupportTriageOutput
  error?: string
}> {
  try {
    if (!supportTriageFlow.workflowId) {
      throw Error("Workflow not found in config.")
    }

    const workflowInput = Object.keys(supportTriageFlow.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof SupportTriageInput]
        return acc
      },
      {} as Record<string, unknown>,
    )

    const response = await lamaticClient.executeFlow(supportTriageFlow.workflowId, workflowInput)
    const rawResult = response?.result
    const result =
      rawResult?.output ??
      rawResult?.result ??
      rawResult

    if (!result) {
      throw new Error(`No result returned from workflow. Response shape: ${JSON.stringify(response)}`)
    }

    return {
      success: true,
      result: {
        category: String(result.category ?? ""),
        severity: String(result.severity ?? ""),
        priority_reason: String(result.priority_reason ?? ""),
        possible_duplicate: parseBoolean(result.possible_duplicate),
        recommended_owner: String(result.recommended_owner ?? ""),
        sla_risk: parseBoolean(result.sla_risk),
        escalation_summary: String(result.escalation_summary ?? ""),
      },
    }
  } catch (error) {
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
