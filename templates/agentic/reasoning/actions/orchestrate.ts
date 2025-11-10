"use server"

import { lamaticClient } from "@/lib/lamatic-client"
import config from "@/lamatic-config.json"

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

interface FlowResult {
  [key: string]: any
}

interface StepResult {
  stepId: string
  stepName: string
  success: boolean
  data?: any
  error?: string
}

const flows = config.flows as Record<string, FlowConfig>

export async function orchestratePipelineStep(
  query: string,
  history: any[],
  step: "step1" | "step2A" | "step2B" | "step2C" | "step3",
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
      console.log(`[v0] Step ${step} not found in config, skipping`)
      return {
        success: true,
        stepId: step,
        stepName: step,
        data: {},
      }
    }

    console.log(`[v0] Executing ${step}: ${flow.name}`)
    console.log(`[v0] previousResults for ${step}:`, JSON.stringify(previousResults, null, 2))

    const inputs: Record<string, any> = {}

    // Fill inputs based on schema
    for (const inputKey of Object.keys(flow.inputSchema)) {
      if (inputKey === "query") {
        inputs[inputKey] = query
      } else if (inputKey === "history") {
        inputs[inputKey] = history
      } else if (inputKey === "steps") {
        if (previousResults?.step1?.steps) {
          inputs[inputKey] = previousResults.step1.steps
        }
      } else if (inputKey === "research" && step === "step3") {
        const combinedResearch: any[] = []

        console.log("[v0] Building research array for step3")

        if (previousResults?.step2A?.research) {
          console.log("[v0] Adding step2A.research to combined research")
          combinedResearch.push(previousResults.step2A.research)
        }

        if (previousResults?.step2B?.research) {
          console.log("[v0] Adding step2B.research to combined research")
          combinedResearch.push(previousResults.step2B.research)
        }

        if (previousResults?.step2C?.research) {
          console.log("[v0] Adding step2C.research to combined research")
          combinedResearch.push(previousResults.step2C.research)
        }

        console.log("[v0] Final combinedResearch structure:", JSON.stringify(combinedResearch, null, 2))
        console.log("[v0] combinedResearch length:", combinedResearch.length)
        inputs[inputKey] = combinedResearch
      } else if (previousResults) {
        // Try to map from previous results
        for (const [prevStep, prevResult] of Object.entries(previousResults)) {
          if (prevResult && prevResult[inputKey] !== undefined) {
            inputs[inputKey] = prevResult[inputKey]
            break
          }
        }
      }
    }

    console.log(`[v0] ${step} final inputs:`, JSON.stringify(inputs, null, 2))

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)

    console.log(`[v0] ${step} raw API response structure:`, JSON.stringify(Object.keys(resData.result), null, 2))
    console.log(`[v0] ${step} raw API response data:`, JSON.stringify(resData.result, null, 2))

    const output: Record<string, any> = {}

    // Store declared outputs from outputSchema
    for (const [key] of Object.entries(flow.outputSchema)) {
      if (resData.result[key] !== undefined) {
        console.log(
          `[v0] ${step} capturing output field "${key}":`,
          typeof resData.result[key],
          Array.isArray(resData.result[key]) ? `Array(${resData.result[key].length})` : "",
        )
        output[key] = resData.result[key]
      } else {
        console.log(`[v0] ${step} WARNING: expected output field "${key}" is missing in API response!`)
      }
    }

    if (resData.result.steps) {
      output.steps = resData.result.steps
    }

    console.log(`[v0] ${step} final output:`, JSON.stringify(output, null, 2))

    return {
      success: true,
      stepId: step,
      stepName: flow.name,
      data: output,
    }
  } catch (error) {
    console.error(`[v0] Error executing ${step}:`, error)
    return {
      success: false,
      stepId: step,
      stepName: flows[step]?.name || step,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function* orchestratePipelineStepByStep(
  query: string,
  history: any[],
): AsyncGenerator<StepResult, void, unknown> {
  try {
    const results: Record<string, FlowResult> = {}

    // --- Topological sort by dependsOn ---
    const getExecutionOrder = (): string[] => {
      const order: string[] = []
      const visited = new Set<string>()

      const visit = (stepId: string) => {
        if (visited.has(stepId)) return
        visited.add(stepId)
        const flow = flows[stepId]
        if (flow.dependsOn) {
          for (const dep of flow.dependsOn) {
            visit(dep)
          }
        }
        order.push(stepId)
      }

      for (const stepId of Object.keys(flows)) {
        visit(stepId)
      }
      return order
    }

    const executionOrder = getExecutionOrder()
    console.log("[v0] Execution order:", executionOrder)

    for (const stepId of executionOrder) {
      const flow = flows[stepId]
      console.log(`[v0] Executing ${stepId}: ${flow.name}`)

      const inputs: Record<string, any> = {}

      // Fill inputs based on schema
      for (const inputKey of Object.keys(flow.inputSchema)) {
        if (inputKey === "query") {
          inputs[inputKey] = query
        } else if (inputKey === "history") {
          inputs[inputKey] = history
        } else if (inputKey === "steps") {
          if (results["step1"] && results["step1"].steps) {
            inputs[inputKey] = results["step1"].steps
          }
        } else if (inputKey === "research" && stepId === "step3") {
          const combinedResearch: any[] = []
          if (results["step2A"] && results["step2A"].research) {
            combinedResearch.push(results["step2A"].research)
          }
          if (results["step2B"] && results["step2B"].research) {
            combinedResearch.push(results["step2B"].research)
          }
          if (results["step2C"] && results["step2C"].research) {
            combinedResearch.push(results["step2C"].research)
          }
          inputs[inputKey] = combinedResearch
        } else if (flow.dependsOn) {
          // Try to map from dependency outputs
          for (const depId of flow.dependsOn) {
            const depResult = results[depId]
            if (depResult && depResult[inputKey] !== undefined) {
              inputs[inputKey] = depResult[inputKey]
              break
            }
          }
        }
      }

      console.log(`[v0] ${stepId} inputs:`, inputs)

      try {
        const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
        console.log(`[v0] ${stepId} raw response:`, resData)

        const output: FlowResult = {}

        // Always capture steps if present
        if (resData.result.steps) {
          output.steps = resData.result.steps
        }

        if ((stepId === "step2A" || stepId === "step2B" || stepId === "step2C") && resData.result.result) {
          output.result = resData.result.result
        }

        // Store declared outputs
        for (const [key] of Object.entries(flow.outputSchema)) {
          if (resData.result[key] !== undefined) {
            output[key] = resData.result[key]
          }
        }

        results[stepId] = output
        console.log(`[v0] ${stepId} completed:`, output)

        yield {
          stepId,
          stepName: flow.name,
          success: true,
          data: output,
        }
      } catch (error) {
        console.error(`[v0] Error executing ${stepId}:`, error)
        yield {
          stepId,
          stepName: flow.name,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }
        return
      }
    }
  } catch (error) {
    console.error("[v0] Pipeline error:", error)
    yield {
      stepId: "pipeline",
      stepName: "Pipeline",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function orchestratePipeline(
  query: string,
  history: any[],
): Promise<{
  success: boolean
  answer?: string
  steps?: string
  references?: string[]
  error?: string
}> {
  try {
    const results: Record<string, FlowResult> = {}

    let finalAnswer = ""
    let stepTrace = ""
    let references: string[] = []

    // --- Topological sort by dependsOn ---
    const getExecutionOrder = (): string[] => {
      const order: string[] = []
      const visited = new Set<string>()

      const visit = (stepId: string) => {
        if (visited.has(stepId)) return
        visited.add(stepId)
        const flow = flows[stepId]
        if (flow.dependsOn) {
          for (const dep of flow.dependsOn) {
            visit(dep)
          }
        }
        order.push(stepId)
      }

      for (const stepId of Object.keys(flows)) {
        visit(stepId)
      }
      return order
    }

    const executionOrder = getExecutionOrder()
    console.log("[v0] Execution order:", executionOrder)

    for (const stepId of executionOrder) {
      const flow = flows[stepId]
      console.log(`[v0] Executing ${stepId}: ${flow.name}`)

      const inputs: Record<string, any> = {}

      // Fill inputs based on schema
      for (const inputKey of Object.keys(flow.inputSchema)) {
        if (inputKey === "query") {
          inputs[inputKey] = query
        } else if (inputKey === "history") {
          inputs[inputKey] = history
        } else if (inputKey === "steps") {
          if (results["step1"] && results["step1"].steps) {
            inputs[inputKey] = results["step1"].steps
          }
        } else if (inputKey === "research" && stepId === "step3") {
          const combinedResearch: any[] = []
          if (results["step2A"] && results["step2A"].research) {
            combinedResearch.push(results["step2A"].research)
          }
          if (results["step2B"] && results["step2B"].research) {
            combinedResearch.push(results["step2B"].research)
          }
          if (results["step2C"] && results["step2C"].research) {
            combinedResearch.push(results["step2C"].research)
          }
          inputs[inputKey] = combinedResearch
        } else if (flow.dependsOn) {
          // Try to map from dependency outputs
          for (const depId of flow.dependsOn) {
            const depResult = results[depId]
            if (depResult && depResult[inputKey] !== undefined) {
              inputs[inputKey] = depResult[inputKey]
              break
            }
          }
        }
      }

      console.log(`[v0] ${stepId} inputs:`, inputs)

      try {
        const resData = await lamaticClient.executeFlow(flow.workflowId, inputs)
        console.log(`[v0] ${stepId} raw response:`, resData)

        const output: FlowResult = {}

        // Always capture steps if present
        if (resData.result.steps) {
          output.steps = resData.result.steps
          stepTrace = resData.result.steps
        }

        if ((stepId === "step2A" || stepId === "step2B" || stepId === "step2C") && resData.result.result) {
          output.result = resData.result.result
        }

        // Store declared outputs
        for (const [key] of Object.entries(flow.outputSchema)) {
          if (resData.result[key] !== undefined) {
            output[key] = resData.result[key]
          }
        }

        results[stepId] = output

        // Post-process final fields
        if (output.links) {
          references = Array.isArray(output.links) ? output.links : []
        }
        if (output.answer) {
          finalAnswer = output.answer
        }

        console.log(`[v0] ${stepId} completed:`, output)
      } catch (error) {
        console.error(`[v0] Error executing ${stepId}:`, error)
        throw new Error(`Failed to execute ${flow.name}: ${error}`)
      }
    }

    return {
      success: true,
      answer: finalAnswer,
      steps: stepTrace,
      references: references,
    }
  } catch (error) {
    console.error("[v0] Pipeline error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
