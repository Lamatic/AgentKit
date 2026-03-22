"use server"

import { lamaticClient } from "@/lib/lamatic-client"

type Priority = "High" | "Medium" | "Low"

function normalizePriority(p: string): Priority {
  const cap = ((p ?? "medium").charAt(0).toUpperCase() + (p ?? "medium").slice(1).toLowerCase()) as Priority
  return (["High", "Medium", "Low"] as Priority[]).includes(cap) ? cap : "Medium"
}

function extractParsed(resData: any): any {
  // Try every possible path the Lamatic SDK might use
  const candidates = [
    resData?.result?.result,           // {result: {result: {...}}}
    resData?.result,                   // {result: {...}}
    resData?.data?.result,             // {data: {result: {...}}}
    resData?.data,                     // {data: {...}}
    resData,                           // top-level
  ]
  for (const c of candidates) {
    if (c && typeof c === "object" && (c.decisions || c.action_items || c.summary_report)) {
      return c
    }
  }
  // If none matched, try parsing the first string candidate
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().startsWith("{")) {
      try {
        const cleaned = c.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        return JSON.parse(cleaned)
      } catch {}
    }
  }
  return null
}

export async function analyzeMeeting(meetingNotes: string): Promise<{
  success: boolean
  data?: {
    decisions: string[]
    action_items: Array<{ task: string; owner: string; deadline: string; priority: Priority }>
    summary_report: string
    followup_email: string
  }
  rawResult?: string
  error?: string
}> {
  try {
    const flowId = process.env.MEETING_ACTION_FLOW_ID
    if (!flowId) throw new Error("MEETING_ACTION_FLOW_ID is not set in environment variables.")

    const resData = await lamaticClient.executeFlow(flowId, { meeting_notes: meetingNotes })
    console.log("[meeting-agent] Full SDK response:", JSON.stringify(resData))

    const parsed = extractParsed(resData)
    console.log("[meeting-agent] Extracted parsed:", JSON.stringify(parsed))

    if (!parsed) {
      // Return raw so the UI can show something
      return { success: true, rawResult: JSON.stringify(resData, null, 2) }
    }

    return {
      success: true,
      data: {
        decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
        action_items: Array.isArray(parsed.action_items)
          ? parsed.action_items.map((item: any) => ({
              task: item.task ?? "",
              owner: item.owner ?? "Unassigned",
              deadline: item.deadline ?? "TBD",
              priority: normalizePriority(item.priority ?? "medium"),
            }))
          : [],
        summary_report: parsed.summary_report ?? "",
        followup_email: parsed.followup_email ?? "",
      },
    }
  } catch (error) {
    console.error("[meeting-agent] Error:", error)
    let errorMessage = "Unknown error occurred"
    if (error instanceof Error) {
      errorMessage = error.message
      if (error.message.includes("fetch failed"))
        errorMessage = "Network error: Cannot connect to the service."
      else if (error.message.includes("API key"))
        errorMessage = "Authentication error: Check your LAMATIC_API_KEY."
    }
    return { success: false, error: errorMessage }
  }
}
