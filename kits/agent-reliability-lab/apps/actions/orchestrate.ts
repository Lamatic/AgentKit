"use server"

import lamaticConfig from "../../lamatic.config"
import { getLamaticClient } from "@/lib/lamatic-client"

export interface AuditReport {
  overallScore: number
  verdict: string
  hasCriticalFail: boolean
  categoryScores: Record<string, number | null>
  coverage: Record<string, string>
  criticalIssues: { source: string; issue: string; recommendation: string | null }[]
  warnings: string[]
  suggestions: string[]
  rewrittenPrompt: string
  changeLog: { change: string; findingAddressed: string }[]
  reliabilityDetails: { probeId: string; consistent: boolean; variantCount: number }[]
  generatedAt: string
}

export interface AuditInput {
  systemPrompt: string
  toolSchema: string
  constitutionDoc: string
  targetEndpointUrl: string
  targetEndpointAuthHeader: string
  referenceQA: string
  depth: "quick" | "standard" | "deep"
}

interface LamaticFlowResponse {
  result?: { report?: AuditReport }
  report?: AuditReport
  data?: { report?: AuditReport }
}

/**
 * Runs the Agent Reliability Lab flow via the Lamatic SDK and extracts the report.
 * @param input - The audit request (target system prompt and optional context/endpoint).
 * @returns The audit report on success, or an error message on failure.
 */
export async function runAudit(
  input: AuditInput
): Promise<{ success: boolean; data?: AuditReport; error?: string }> {
  try {
    const lamaticClient = getLamaticClient()

    const auditFlowStep = lamaticConfig.steps[0]
    const flowId = auditFlowStep.envKey ? process.env[auditFlowStep.envKey] : undefined

    if (!flowId) {
      throw new Error(
        `Missing environment variable for the flow ID (expected env key: ${auditFlowStep.envKey}).`
      )
    }

    const inputs = {
      systemPrompt: input.systemPrompt,
      toolSchema: input.toolSchema,
      constitutionDoc: input.constitutionDoc,
      targetEndpoint: {
        url: input.targetEndpointUrl,
        authHeader: input.targetEndpointAuthHeader,
      },
      referenceQA: input.referenceQA,
      depth: input.depth,
    }

    const resData = (await lamaticClient.executeFlow(flowId, inputs)) as LamaticFlowResponse

    const report: AuditReport | undefined =
      resData?.result?.report ?? resData?.report ?? resData?.data?.report

    if (!report) {
      throw new Error("No report found in the flow response.")
    }

    return { success: true, data: report }
  } catch (error) {
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: unable to reach Lamatic. Check your internet connection and try again."
      } else if (error.message.toLowerCase().includes("api key")) {
        errorMessage = "Authentication error: check your Lamatic API configuration."
      }
    }
    return { success: false, error: errorMessage }
  }
}
