"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import kitConfig from "../../lamatic.config"

function formatVerifierResult(response: Record<string, unknown> | string): string {
  let parsed: Record<string, unknown>
  if (typeof response === "string") {
    try {
      parsed = JSON.parse(response) as Record<string, unknown>
    } catch {
      // Not valid JSON — return the raw string as-is
      return response
    }
  } else {
    parsed = response
  }

  const r = parsed as {
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

function getWorkflowId(stepId: string): string {
  const step = kitConfig.steps.find((s) => s.id === stepId)
  if (!step) throw new Error(`Step "${stepId}" not found in lamatic.config`)
  const workflowId = process.env[step.envKey]
  if (!workflowId) throw new Error(`Env var "${step.envKey}" is not set`)
  return workflowId
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

    const workflowId = getWorkflowId("email-verifier")
    const inputs = { sender, subject, body }

    console.log("[Email Agent] Executing verifier flow:", workflowId, inputs)
    const resData = await lamaticClient.executeFlow(workflowId, inputs)
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
  body: string,
  verdict?: string,
  confidence?: number,
  reasons?: string[]
): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  try {
    console.log("[Email Agent] Drafting reply for email from:", sender)

    let finalVerdict = verdict
    let finalConfidence = confidence
    let finalReasons = reasons

    // Check if verification result is already available in the arguments
    if (finalVerdict === undefined || finalConfidence === undefined || finalReasons === undefined) {
      console.log("[Email Agent] Verification result not provided in arguments. Running verifier first...")
      const verifierWorkflowId = getWorkflowId("email-verifier")
      const verifierInputs = { sender, subject, body }

      console.log("[Email Agent] Executing verifier flow:", verifierWorkflowId, verifierInputs)
      const verifierRes = await lamaticClient.executeFlow(verifierWorkflowId, verifierInputs)
      console.log("[Email Agent] Verifier response:", JSON.stringify(verifierRes, null, 2))

      const response = verifierRes?.result?.output
      if (!response) {
        throw new Error("No output analysis report found in response")
      }

      let parsedResponse: any = response
      if (typeof response === "string") {
        try {
          parsedResponse = JSON.parse(response)
        } catch {
          parsedResponse = {}
        }
      }

      if (finalVerdict === undefined) {
        finalVerdict = parsedResponse?.verdict ?? "unknown"
      }
      if (finalConfidence === undefined) {
        finalConfidence = parsedResponse?.confidence ?? 0
      }
      if (finalReasons === undefined) {
        finalReasons = parsedResponse?.reasons ?? []
      }
    } else {
      console.log("[Email Agent] Reusing provided verification result:", {
        verdict: finalVerdict,
        confidence: finalConfidence,
        reasons: finalReasons,
      })
    }

    const workflowId = getWorkflowId("email-replier")

    console.log("[Email Agent] Running replier flow:", workflowId)
    const replierRes = await lamaticClient.executeFlow(workflowId, {
      sender,
      subject,
      body,
      verdict: finalVerdict,
      confidence: finalConfidence,
      reasons: finalReasons,
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
