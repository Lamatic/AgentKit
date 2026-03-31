"use server"

import { getLamaticClient } from "@/lib/lamatic-client"
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

const INPUT_LIMITS: Record<keyof ColdEmailInput, number> = {
  profile_data: 3000,
  prospect_name: 200,
  prospect_role: 200,
  company_name: 200,
  product_description: 1500,
  value_proposition: 1000,
  call_to_action: 300,
}

const REQUIRED_FIELDS: (keyof ColdEmailInput)[] = [
  "profile_data",
  "prospect_name",
  "company_name",
  "product_description",
  "value_proposition",
  "call_to_action",
]

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

    for (const key of REQUIRED_FIELDS) {
      if (!input[key]?.trim()) {
        throw new Error(`Missing required field: ${key.replace(/_/g, " ")}`)
      }
    }

    for (const [key, max] of Object.entries(INPUT_LIMITS) as [keyof ColdEmailInput, number][]) {
      if ((input[key] ?? "").length > max) {
        throw new Error(`${key.replace(/_/g, " ")} exceeds the ${max}-character limit.`)
      }
    }

    const workflowInput = Object.keys(flow.inputSchema).reduce(
      (acc, key) => {
        acc[key] = input[key as keyof ColdEmailInput]
        return acc
      },
      {} as Record<string, string>,
    )

    const client = getLamaticClient()
    const response = await client.executeFlow(flow.workflowId, workflowInput)

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
