"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import type { AnalysisResult } from "@/lib/analysis-result"
import { config } from "../orchestrate.js"

type AnalysisInput = {
  transcript: string
}

const analysisFlow = config.flows.interviewAnalysis

function parseResponsePayload(response: unknown): Partial<AnalysisResult> {
  if (!response) {
    return {}
  }

  if (typeof response === "object") {
    return response as Partial<AnalysisResult>
  }

  if (typeof response !== "string") {
    return {}
  }

  try {
    return JSON.parse(response) as Partial<AnalysisResult>
  } catch {
    return {
      summary: response,
    }
  }
}

export async function analyzeInterviewTranscript(input: AnalysisInput): Promise<{
  success: boolean
  result?: AnalysisResult
  error?: string
}> {
  try {
    if (!analysisFlow?.workflowId) {
      throw new Error("Workflow not found in config.")
    }

    if (!input.transcript.trim()) {
      throw new Error("Transcript is empty. Start transcription before analysis.")
    }

    const inputType = "text"
    const instructions = input.transcript

    const workflowInput = {
      mode: inputType,
      instructions,
      userPrompt: instructions,
      prompt: instructions,
      type: inputType,
    }

    const response = await lamaticClient.executeFlow(analysisFlow.workflowId, workflowInput)

    if (response?.status === "error") {
      throw new Error(response.message || "Lamatic workflow execution failed")
    }

    const result = response?.result || {}
    const outputPayload = result.output && typeof result.output === "object" ? result.output : {}
    const responsePayload = parseResponsePayload(result.response)

    const output = {
      summary: result.summary || outputPayload.summary || responsePayload.summary || "",
      keySignals: result.keySignals || outputPayload.keySignals || responsePayload.keySignals || "",
      followUps: result.followUps || outputPayload.followUps || responsePayload.followUps || "",
      recommendation: result.recommendation || outputPayload.recommendation || responsePayload.recommendation || "",
    }

    if (Object.values(output).every((value) => !value)) {
      throw new Error("No analysis result returned from workflow")
    }

    return {
      success: true,
      result: output,
    }
  } catch (error) {
    let errorMessage = "Unknown error occurred"

    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to Lamatic service."
      } else if (error.message.includes("API key")) {
        errorMessage = "Authentication error: Please check your Lamatic API credentials."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}
