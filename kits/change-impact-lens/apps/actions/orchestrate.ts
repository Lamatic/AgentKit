"use server"

import { analyzeImpact } from "@/lib/impact-analysis"
import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

export async function analyzeChangeImpact(
  targetFile: string,
  maxHops = 3
): Promise<{
  success: boolean
  data?: {
    targetFile: string
    maxHops: number
    dependents: { file: string; hops: number }[]
    explanation?: string
  }
  error?: string
}> {
  try {
    const targetFolder = process.cwd()

    const result = await analyzeImpact(targetFolder, targetFile, maxHops)

    if (!result.found) {
      return {
        success: false,
        error: `"${targetFile}" was not found in this project. Try a path like "lib/utils.ts" or "app/page.tsx".`,
      }
    }

    // Format the raw evidence as readable text for the LLM flow.
    const dependentsText =
      result.dependents.length === 0
        ? "No files depend on this one, directly or indirectly."
        : result.dependents
            .map((d) => `[${d.hops} hop${d.hops > 1 ? "s" : ""}] ${d.file}`)
            .join(", ")

    let explanation: string | undefined

    try {
      const flow = config.flows.changeImpact
      if (flow.workflowId) {
        const flowResult = await lamaticClient.executeFlow(flow.workflowId, {
          target_file: result.targetFile,
          dependents_evidence: dependentsText,
        })
        explanation = flowResult?.result?.answer
      }
    } catch (flowError) {
      console.error("[change-impact-lens] Lamatic flow call failed:", flowError)
      // Non-fatal: we still return the raw analysis even if the explanation step fails.
    }

    return {
      success: true,
      data: {
        targetFile: result.targetFile,
        maxHops: result.maxHops,
        dependents: result.dependents,
        explanation,
      },
    }
  } catch (error) {
    console.error("[change-impact-lens] analysis error:", error)
    let errorMessage = "Unknown error occurred during analysis."
    if (error instanceof Error) {
      errorMessage = error.message
    }
    return { success: false, error: errorMessage }
  }
}