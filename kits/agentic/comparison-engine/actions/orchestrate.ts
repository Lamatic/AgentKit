"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import { config } from "../orchestrate.js"

interface FlowConfig {
  name: string
  workflowId: string
  description: string
  mode: "sync" | "async"
  expectedOutput: string | string[]
  inputSchema: Record<string, string>
  outputSchema: Record<string, string>
  dependsOn?: string[]
}

const flows = config.flows as Record<string, FlowConfig>

export async function orchestratePipelineStep(
  query: string,
  history: any[],
  step: string,
  previousResults?: Record<string, any>,
): Promise<{
  success: boolean
  stepId: string
  stepName: string
  data?: any
  error?: string
}> {
  try {
    const flow = flows[step]

    if (!flow) {
      return {
        success: false,
        stepId: step,
        stepName: step,
        error: `Step ${step} not found in config`,
      }
    }

    console.log(`[ComparisonKit] Executing ${step}: ${flow.name}`)

    const inputs: Record<string, any> = {}

    // Fill inputs based on schema
    for (const inputKey of Object.keys(flow.inputSchema)) {
      if (inputKey === "entity") {
        inputs[inputKey] = query // In research steps, query is the entity name
      } else if (inputKey === "criteria") {
        inputs[inputKey] = query // or explicit criteria
      } else if (previousResults && previousResults[inputKey] !== undefined) {
        inputs[inputKey] = previousResults[inputKey]
      }
    }

    // Special handling for the compare step
    if (step === "compare_entities" && previousResults) {
      inputs.research_a = previousResults.research_a
      inputs.research_b = previousResults.research_b
      inputs.criteria = previousResults.criteria
    }

    // Special handling for verdict step
    if (step === "final_verdict" && previousResults) {
      inputs.comparison_data = previousResults.comparison_data
      inputs.criteria = previousResults.criteria
    }

    console.log(`[ComparisonKit] ${step} inputs:`, JSON.stringify(inputs, null, 2))

    if (!flow.workflowId) {
       throw new Error(`Workflow ID for ${step} is not configured in .env`)
    }

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    if (!resData.result) {
      throw new Error(`No result returned from Lamatic for step ${step}`)
    }

    const output: Record<string, any> = {}

    // Store declared outputs from outputSchema
    for (const key of Object.keys(flow.outputSchema)) {
      if (resData.result[key] !== undefined) {
        output[key] = resData.result[key]
      }
    }

    console.log(`[ComparisonKit] ${step} final output:`, JSON.stringify(output, null, 2))

    return {
      success: true,
      stepId: step,
      stepName: flow.name,
      data: output,
    }
  } catch (error) {
    console.error(`[ComparisonKit] Error executing ${step}:`, error)
    return {
      success: false,
      stepId: step,
      stepName: flows[step]?.name || step,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
