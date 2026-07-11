"use server"

import { z } from "zod"
import { lamaticClient } from "@/lib/lamatic-client"
import config from "../../lamatic.config"

const LogEntrySchema = z.object({
  id: z.string(),
  prompt: z.string(),
  context: z.string(),
  response: z.string(),
  expected_schema: z.record(z.string(), z.unknown()).optional(),
})

export type LogEntry = z.infer<typeof LogEntrySchema>

export type FailureMode = {
  name: string
  count: number
  examples: string[]
  description: string
  suggested_direction: string
}

export type DetectionReport = {
  summary: {
    total_logs: number
    flagged: number
    clusters: number
  }
  failure_modes: FailureMode[]
}

type ActionResult = { success: true; data: DetectionReport } | { success: false; error: string }

function resolveFlowId(): string {
  const step = config.steps[0]
  if (!step?.envKey) {
    throw new Error("No flow envKey configured in lamatic.config.ts")
  }
  const flowId = process.env[step.envKey]
  if (!flowId) {
    throw new Error(`Missing environment variable: ${step.envKey}`)
  }
  return flowId
}

export async function detectSilentFailures(logs: unknown[]): Promise<ActionResult> {
  try {
    const parsed = z.array(LogEntrySchema).min(1).safeParse(logs)
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return {
        success: false,
        error: issue ? `Invalid log entry at ${issue.path.join(".")}: ${issue.message}` : "Invalid log batch.",
      }
    }

    const flowId = resolveFlowId()
    const resData = await lamaticClient.executeFlow(flowId, { logs: parsed.data })

    const report = resData?.result?.result as DetectionReport | undefined

    if (!report || !report.summary || !Array.isArray(report.failure_modes)) {
      throw new Error("Unexpected response shape from the flow.")
    }

    return { success: true, data: report }
  } catch (error) {
    console.error("[detectSilentFailures] error:", error)

    let message = "Something went wrong while running detection. Please try again."
    if (error instanceof Error) {
      if (error.message.includes("fetch failed")) {
        message = "Network error: could not reach the Lamatic API. Check your connection and credentials."
      } else if (
        error.message.toLowerCase().includes("api key") ||
        error.message.toLowerCase().includes("unauthorized")
      ) {
        message = "Authentication error: check LAMATIC_API_KEY and LAMATIC_PROJECT_ID in your .env.local."
      } else if (
        error.message.startsWith("Invalid log entry") ||
        error.message.startsWith("Missing environment variable") ||
        error.message.startsWith("No flow envKey") ||
        error.message === "Unexpected response shape from the flow."
      ) {
        message = error.message
      }
    }

    return { success: false, error: message }
  }
}
