"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

type AnalysisInput = {
  transcript: string
}

type AnalysisResult = {
  summary: string
}

const analysisFlow = config.flows.interviewAnalysis

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

    console.log("[v0] Generating content with:", { inputType, instructions })
    console.log("[v0] Using workflow:", analysisFlow.name, analysisFlow.workflowId)

    const workflowInput = {
      mode: inputType,
      instructions,
      userPrompt: instructions,
      prompt: instructions,
      type: inputType,
    }

    console.log("[v0] Sending inputs:", workflowInput)
    const response = await lamaticClient.executeFlow(analysisFlow.workflowId, workflowInput)
    console.log("[v0] Raw response:", response)
    if (response?.status === "error") {
      throw new Error(response.message || "Lamatic workflow execution failed")
    }

    const result = response?.result || {}

    // Support multiple output shapes from deployed Lamatic workflows.
    const output = {
      summary: result.summary || result.output?.summary || result.response || "",
    }

    if (!output.summary) {
      throw new Error("No analysis summary returned from workflow")
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
