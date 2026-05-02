"use server"

import { getLamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"
import { join } from "node:path"
import { access, readFile } from "node:fs/promises"

const DEFAULT_DISCLAIMER =
  "This response is for informational purposes only and is not legal advice. Consult a licensed attorney for advice specific to your situation."

type LegalAssistantResult = {
  answer: string
  references: string[]
  nextSteps: string[]
  disclaimer: string
}

type FlowNode = {
  data?: {
    nodeId?: string
  }
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : String(item).trim()))
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean)
  }

  return []
}

function extractAnswer(result: Record<string, unknown>): string {
  const candidates = [
    result.answer,
    result.response,
    result.summary,
    result.legalSummary,
    result.output,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ""
}

async function usesChatTriggerExport(): Promise<boolean> {
  try {
    const candidates = [
      join(process.cwd(), "flows", "assistant-legal-advisor", "config.json"),
      join(process.cwd(), "kits", "assistant", "legal", "flows", "assistant-legal-advisor", "config.json"),
    ]

    let flowConfigPath: string | undefined
    for (const path of candidates) {
      try {
        await access(path)
        flowConfigPath = path
        break
      } catch {
        // Try the next candidate path.
      }
    }

    if (!flowConfigPath) {
      return false
    }
    const raw = await readFile(flowConfigPath, "utf-8")
    const parsed = JSON.parse(raw) as { nodes?: FlowNode[] }
    const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : []
    return nodes.some((node) => node?.data?.nodeId === "chatTriggerNode")
  } catch {
    return false
  }
}

/**
 * Server-side legal guidance orchestration.
 * This path requires an API Request trigger flow.
 * The bundled flows/assistant-legal-advisor export uses Chat Widget trigger
 * and is intended for client-side widget usage.
 */
export async function getLegalGuidance(
  question: string,
  jurisdiction: string,
  context: string,
): Promise<{
  success: boolean
  data?: LegalAssistantResult
  error?: string
}> {
  try {
    if (await usesChatTriggerExport()) {
      throw new Error(
        "This flow export uses Chat Widget trigger and is not compatible with executeFlow API calls in this kit. Deploy an API Request trigger flow and update ASSISTANT_LEGAL_ADVISOR.",
      )
    }

    const sanitizedQuestion = question.trim()
    const sanitizedJurisdiction = jurisdiction.trim()
    const sanitizedContext = context.trim()

    if (!sanitizedQuestion) {
      throw new Error("Question is required")
    }

    const flows = config.flows
    const firstFlowKey = Object.keys(flows)[0]

    if (!firstFlowKey) {
      throw new Error("No workflows found in configuration")
    }

    const flow = flows[firstFlowKey as keyof typeof flows] as (typeof flows)[keyof typeof flows]

    if (!flow.workflowId) {
      throw new Error("Workflow not found in config")
    }

    const inputAliases: Record<string, unknown> = {
      question: sanitizedQuestion,
      query: sanitizedQuestion,
      userQuery: sanitizedQuestion,
      prompt: sanitizedQuestion,
      jurisdiction: sanitizedJurisdiction,
      region: sanitizedJurisdiction,
      context: sanitizedContext,
      additionalContext: sanitizedContext,
      details: sanitizedContext,
    }

    const workflowInput: Record<string, unknown> = {}

    for (const key of Object.keys(flow.inputSchema || {})) {
      const value = inputAliases[key]
      if (value !== undefined && value !== "") {
        workflowInput[key] = value
      }
    }

    if (Object.keys(workflowInput).length === 0) {
      workflowInput.question = sanitizedQuestion
      if (sanitizedJurisdiction) {
        workflowInput.jurisdiction = sanitizedJurisdiction
      }
      if (sanitizedContext) {
        workflowInput.context = sanitizedContext
      }
    }

    const lamaticClient = getLamaticClient()
    const response = await lamaticClient.executeFlow(flow.workflowId, workflowInput)

    if (response?.status === "error") {
      throw new Error(response?.message || "Lamatic flow returned an error")
    }

    const result = (response?.result ?? {}) as Record<string, unknown>

    const answer = extractAnswer(result)
    if (!answer) {
      throw new Error("No answer found in flow response")
    }

    const references = toStringArray(
      result.references ?? result.citations ?? result.sources ?? result.statutes ?? result.caseLaws,
    )
    const nextSteps = toStringArray(result.nextSteps ?? result.recommendedActions ?? result.actions ?? result.steps)

    const disclaimer =
      typeof result.disclaimer === "string" && result.disclaimer.trim()
        ? result.disclaimer.trim()
        : DEFAULT_DISCLAIMER

    return {
      success: true,
      data: {
        answer,
        references,
        nextSteps,
        disclaimer,
      },
    }
  } catch (error) {
    let errorMessage = "Unknown error occurred"

    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic service. Check your internet and try again."
      } else if (error.message.toLowerCase().includes("timed out")) {
        errorMessage =
          "Lamatic request timed out. Your flow may be configured as Chat Widget trigger or long-running sync flow. Use an API Request trigger or async flow/polling for this kit."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Check your Lamatic API configuration."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
