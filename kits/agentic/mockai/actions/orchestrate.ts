"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"
import { z } from "zod"

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
    // console.log("[v0] Generating questions - Flow started")

    const flow = config.flows.question

    if (!flow.workflowId) {
      throw new Error("Workflow ID not found in config for question flow.")
    }

    const inputs = {
      jobTitle,
      yearsOfExp: parseInt(yearsOfExp.toString()),
      jobDesc
    }

    const inputSchema = z.object({
      jobTitle: z.string().min(1, "Job title is required"),
      yearsOfExp: z.number().min(0, "Years of experience must be a valid number"),
      jobDesc: z.string().optional()
    })

    inputSchema.parse(inputs)

    // console.log(`[v0] Executing flow: ${flow.workflowId}`)

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    // console.log("[v0] Flow execution completed")

    const responseSchema = z.object({
      result: z.object({
        data: z.array(z.string()).min(1, "No questions found in response")
      })
    })

    const validatedResponse = responseSchema.parse(resData)
    const questions = validatedResponse.result.data

    return {
      success: true,
      questions,
    }
  } catch (error) {
    console.error("[v0] Generation error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof z.ZodError) {
      errorMessage = "Validation error: Invalid data format."
    } else if (error instanceof Error) {
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
    // console.log("[v0] Evaluating answers - Flow started", { count: candidateResponses.length })

    const flow = config.flows.feedback

    if (!flow.workflowId) {
      throw new Error("Workflow ID not found in config for feedback flow.")
    }

    // We can just format the string or array to be safe. We pass what's expected.
    const inputs = {
      candidateResponses
    }

    const inputSchema = z.object({
      candidateResponses: z.array(
        z.object({
          question: z.string(),
          answers: z.string()
        })
      ).min(1, "At least one candidate response is required")
    })

    inputSchema.parse(inputs)

    // console.log(`[v0] Executing flow: ${flow.workflowId}`)

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[v0] Flow execution completed")

    const responseSchema = z.object({
      result: z.object({
        positives: z.array(z.string()).optional().default([]),
        negatives: z.array(z.string()).optional().default([]),
        rating: z.number()
      })
    })

    const validatedResponse = responseSchema.parse(resData)
    const result = validatedResponse.result

    return {
      success: true,
      feedback: {
        positives: result.positives,
        negatives: result.negatives,
        rating: result.rating
      },
    }
  } catch (error) {
    console.error("[v0] Evaluation error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof z.ZodError) {
      errorMessage = "Validation error: Invalid data format."
    } else if (error instanceof Error) {
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
