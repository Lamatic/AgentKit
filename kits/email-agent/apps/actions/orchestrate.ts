"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

// Verifier returns a JSON object: { verdict, confidence, reasons, summary }
// Format it as readable Markdown for the UI
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

    // response can be a JSON object { verdict, confidence, reasons, summary } or a string
    const response = resData?.result?.response
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

    // Step 1: Run verifier to get summary for context
    console.log("[Email Agent] Step 1 — Running verifier to generate summary...")
    const verifierRes = await lamaticClient.executeFlow(verifierFlow.workflowId, {
      sender, subject, body,
    })
    console.log("[Email Agent] Verifier (summary) response:", JSON.stringify(verifierRes, null, 2))

    // Extract summary string — if object, pull .summary field; else use as-is
    const verifierResponse = verifierRes?.result?.response
    const summary = typeof verifierResponse === "object" && verifierResponse !== null
      ? (verifierResponse as { summary?: string }).summary ?? JSON.stringify(verifierResponse)
      : String(verifierResponse ?? "")

    // Step 2: Run replier — generate-reply prompt uses {{email}} single variable
    const emailText = `From: ${sender}\nSubject: ${subject}\n\n${body}`
    console.log("[Email Agent] Step 2 — Running replier with email:", emailText)
    const replierRes = await lamaticClient.executeFlow(replierFlow.workflowId, {
      sender,
      subject,
      body,
      summary,
      email: emailText,  // matches {{email}} in generate-reply_llmnode-934_user_1.md
    })
    console.log("[Email Agent] Replier response:", JSON.stringify(replierRes, null, 2))

    const answer = replierRes?.result?.response
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
