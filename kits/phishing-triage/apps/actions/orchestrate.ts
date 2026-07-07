"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate"

export type EmailInput = {
  subject?: string
  from?: string
  reply_to?: string
  body: string
}

export type Verdict = {
  verdict: "phishing" | "suspicious" | "legitimate"
  confidence: number
  risk_score: number
  indicators: string[]
  extracted_urls: string[]
  recommended_action: string
  reasoning: string
  iocs?: Record<string, unknown>
}

export async function analyzeEmail(
  email: EmailInput,
): Promise<{ success: boolean; data?: Verdict; error?: string }> {
  try {
    if (!email?.body || !email.body.trim()) {
      return { success: false, error: "Please paste an email body to analyse." }
    }

    const flow = config.flows.phishingTriage
    if (!flow?.workflowId) {
      throw new Error("Phishing Triage workflow ID is not configured.")
    }

    const inputs = {
      subject: email.subject ?? "",
      from: email.from ?? "",
      reply_to: email.reply_to ?? "",
      body: email.body,
    }

    const resData: any = await lamaticClient.executeFlow(flow.workflowId, inputs)

    // The flow's API Response maps the finaliser output to `answer`.
    const answer = resData?.result?.answer ?? resData?.result?.output ?? resData?.answer

    if (!answer) {
      throw new Error("No verdict was returned by the flow.")
    }

    const parsed: Verdict = typeof answer === "string" ? JSON.parse(answer) : answer

    return { success: true, data: parsed }
  } catch (error) {
    let message = "Unknown error occurred."
    if (error instanceof Error) {
      message = error.message
      if (message.includes("fetch failed")) {
        message = "Network error: unable to reach the Lamatic flow. Check your connection and credentials."
      } else if (message.toLowerCase().includes("api key")) {
        message = "Authentication error: check your Lamatic API configuration."
      }
    }
    return { success: false, error: message }
  }
}
