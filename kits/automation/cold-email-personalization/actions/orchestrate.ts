"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { parseColdEmailResult, type ColdEmailOutput } from "@/lib/parse-cold-email-result"
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
  data?: ColdEmailOutput
  error?: string
}> {
  try {
    if (!flow.workflowId) {
      throw new Error("Workflow ID not configured (AUTOMATION_COLD_EMAIL).")
    }

    const workflowInput = Object.keys(flow.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof ColdEmailInput]
        return acc
      },
      {} as Record<string, string>,
    )

    const response = await lamaticClient.executeFlow(flow.workflowId, workflowInput)

    if (process.env.NODE_ENV === "development") {
      console.log(
        "[cold-email] executeFlow raw response:",
        JSON.stringify(response, null, 2).slice(0, 4000),
      )
    }

    const result = (response as Record<string, unknown>).result
    if ((response as Record<string, unknown>).status === "error" || result == null) {
      const msg = (response as Record<string, unknown>).message
      throw new Error(typeof msg === "string" ? msg : "Workflow returned an error or empty result.")
    }

    const data = parseColdEmailResult(result)
    return { success: true, data }
  } catch (error) {
    console.error("[cold-email] Error:", error instanceof Error ? error.message : error)

    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed")) {
        errorMessage = "Network error: Unable to connect to Lamatic. Check your connection and try again."
      } else if (error.message.includes("API key") || error.message.includes("401")) {
        errorMessage = "Authentication error: Check LAMATIC_API_KEY and project settings."
      }
    }

    return { success: false, error: errorMessage }
  }
}
