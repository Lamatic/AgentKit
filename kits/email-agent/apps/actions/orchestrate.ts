"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

function formatVerifierResult(response: Record<string, unknown> | string): string {
  if (typeof response === "string") return response

  const r = response as {
    verdict?: string
    confidence?: number
    reasons?: string[]
    summary?: string
  }

  const verdictEmoji =
    r.verdict === "legit" ? "✅" : r.verdict === "suspicious" ? "⚠️" : "🚫"

  return `## ${verdictEmoji} Verdict: ${(r.verdict ?? "unknown").toUpperCase()}

**Confidence:** ${r.confidence ?? 0}%

**Summary:** ${r.summary ?? "N/A"}

### Reasons
${(r.reasons ?? []).map((reason) => `- ${reason}`).join("\n")}
`
}

export async function verifyEmail(
  sender: string,
  subject: string,
  body: string
): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    console.log("[Email Agent] Verifying email from:", sender)

    const flow = config.flows.verifier
    if (!flow || !flow.workflowId) {
      throw new Error("Verifier workflow not found in configuration")
    }

    const inputs = { sender, subject, body }

    console.log("[Email Agent] Executing verifier flow:", flow.workflowId, inputs)
    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
    console.log("[Email Agent] Verifier response:", JSON.stringify(resData, null, 2))

    const response = resData?.result?.output
    if (!response) {
      throw new Error("No output analysis report found in response")
    }

    return { success: true, data: formatVerifierResult(response) }
  } catch (error) {
    console.error("[Email Agent] Verifier error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function replyEmail(
  sender: string,
  subject: string,
  body: string
): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    console.log("[Email Agent] Drafting reply for email from:", sender)

    const verifierFlow = config.flows.verifier
    const replierFlow = config.flows.replier

    if (!verifierFlow || !verifierFlow.workflowId) {
      throw new Error("Verifier workflow not found in configuration")
    }
    if (!replierFlow || !replierFlow.workflowId) {
      throw new Error("Replier workflow not found in configuration")
    }

    console.log("[Email Agent] Step 1 — Running verifier...")
    const verifierRes = await lamaticClient.executeFlow(verifierFlow.workflowId, {
      sender, subject, body,
    })
    console.log("[Email Agent] Verifier response:", JSON.stringify(verifierRes, null, 2))

    const verifierResponse = verifierRes?.result?.output
    let verdict = ""
    let confidence = 0
    let reasons: string[] = []

    if (typeof verifierResponse === "object" && verifierResponse !== null) {
      const r = verifierResponse as {
        verdict?: string
        confidence?: number
        reasons?: string[]
      }
      verdict = r.verdict ?? ""
      confidence = r.confidence ?? 0
      reasons = r.reasons ?? []
    }

    console.log("[Email Agent] Step 2 — Running replier...")
    const replierRes = await lamaticClient.executeFlow(replierFlow.workflowId, {
      sender,
      subject,
      body,
      verdict,
      confidence,
      reasons,
    })
    console.log("[Email Agent] Replier response:", JSON.stringify(replierRes, null, 2))

    const answer = replierRes?.result?.output
    if (!answer) {
      throw new Error("No output reply draft found in response")
    }

    return { success: true, data: typeof answer === "string" ? answer : JSON.stringify(answer) }
  } catch (error) {
    console.error("[Email Agent] Replier error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
