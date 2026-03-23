"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { parseColdEmailResult } from "@/lib/parse-cold-email-result"
import { config } from "../orchestrate.js"

export type ColdEmailInput = {
  profile_data: string
  prospect_name: string
  prospect_role: string
  company_name: string
  product_description: string
  value_proposition: string
  call_to_action: string
}

const flow = config.flows.coldEmail

export async function personalizeColdEmail(input: ColdEmailInput): Promise<{
  success: boolean
  data?: ReturnType<typeof parseColdEmailResult>
  error?: string
}> {
  try {
    const workflowInput = Object.keys(flow.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof ColdEmailInput]
        return acc
      },
      {} as Record<string, string>,
    )

    if (!flow.workflowId) {
      throw new Error("Workflow ID not configured (AUTOMATION_COLD_EMAIL).")
    }

    const response = await lamaticClient.executeFlow(flow.workflowId, workflowInput)

    if (response.status === "error" || response.result == null) {
      throw new Error(
        response.message ?? "Workflow returned an error or empty result.",
      )
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[cold-email] executeFlow raw response:",
        JSON.stringify(response, null, 2).slice(0, 8000),
      )
    }

    const data = parseColdEmailResult(response.result)

    return { success: true, data }
  } catch (error) {
    console.error("[cold-email] Error:", error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to Lamatic. Check your connection and try again."
      } else if (error.message.includes("API key") || error.message.includes("401")) {
        errorMessage = "Authentication error: Check LAMATIC_API_KEY and project settings."
      }
    }

    return { success: false, error: errorMessage }
  }
}
