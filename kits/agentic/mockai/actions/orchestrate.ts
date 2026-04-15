"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

export async function generateQuestions(
  jobTitle: string,
  yearsOfExp: number,
  jobDesc: string,
): Promise<{
  success: boolean
  questions?: string[]
  error?: string
}> {
  try {
    console.log("[v0] Generating questions with:", { jobTitle, yearsOfExp, jobDesc })

    const flow = config.flows.question

    if (!flow.workflowId) {
      throw new Error("Workflow ID not found in config for question flow.")
    }

    const inputs = {
      jobTitle,
      yearsOfExp: parseInt(yearsOfExp.toString()),
      jobDesc
    }

    console.log("[v0] Sending inputs:", inputs)

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Raw response:", resData)

    const questions = resData?.result?.data

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      throw new Error("No questions found in response")
    }

    return {
      success: true,
      questions,
    }
  } catch (error) {
    console.error("[v0] Generation error:", error)

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

export async function evaluateAnswers(
  candidateResponses: { question: string, answers: string }[]
): Promise<{
  success: boolean
  feedback?: { positives: string[], negatives: string[], rating: number }
  error?: string
}> {
  try {
    console.log("[v0] Evaluating answers with:", { candidateResponses })

    const flow = config.flows.feedback

    if (!flow.workflowId) {
      throw new Error("Workflow ID not found in config for feedback flow.")
    }

    // We can just format the string or array to be safe. We pass what's expected.
    const inputs = {
      candidateResponses
    }

    console.log("[v0] Sending inputs:", JSON.stringify(inputs))

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Raw response:", resData)

    const result = resData?.result

    if (!result || typeof result.rating !== 'number') {
      throw new Error("No feedback found in response")
    }

    return {
      success: true,
      feedback: {
        positives: result.positives || [],
        negatives: result.negatives || [],
        rating: result.rating
      },
    }
  } catch (error) {
    console.error("[v0] Evaluation error:", error)

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
