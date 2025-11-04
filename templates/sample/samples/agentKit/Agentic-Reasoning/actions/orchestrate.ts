"use server";

import { lamaticClient } from "@/lib/lamatic-client";
import fs from "fs";

const config = JSON.parse(Buffer.from(process.env.LAMATIC_CONFIG_REASONING, "base64").toString("utf8"));

interface FlowConfig {
  name: string;
  workflowId: string;
  description: string;
  mode: "sync" | "async";
  expectedOutput: string | string[];
  inputSchema: Record<string, string>;
  outputSchema: Record<string, string>;
  dependsOn?: string[];
}

interface FlowResult {
  [key: string]: any;
}

interface StepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  data?: any;
  error?: string;
}

const flows = config.flows as Record<string, FlowConfig>;

export async function orchestratePipelineStep(
  query: string,
  history: any[],
  step: "step1" | "step2" | "step3",
  previousResults?: Record<string, any>
): Promise<{
  success: boolean;
  stepId: string;
  stepName: string;
  data?: any;
  error?: string;
}> {
  try {
    const flow = flows[step];

    if (!flow) {
      throw new Error(`Step ${step} not found in configuration`);
    }

    console.log(`[v0] Executing ${step}: ${flow.name}`);

    const inputs: Record<string, any> = {};

    // Fill inputs based on schema
    for (const inputKey of Object.keys(flow.inputSchema)) {
      if (inputKey === "query") {
        inputs[inputKey] = query;
      } else if (inputKey === "history") {
        inputs[inputKey] = history;
      } else if (inputKey === "research" && step === "step3") {
        if (previousResults?.step2?.research) {
          inputs[inputKey] = previousResults.step2.research;
        }
      } else if (previousResults) {
        // Try to map from previous results
        for (const [prevStep, prevResult] of Object.entries(previousResults)) {
          if (prevResult && prevResult[inputKey] !== undefined) {
            inputs[inputKey] = prevResult[inputKey];
            break;
          }
        }
      }
    }

    console.log(`[v0] ${step} inputs:`, inputs);

    const resData = await lamaticClient.executeFlow(flow.workflowId, inputs);
    console.log(`[v0] ${step} raw response:`, resData);

    const output: Record<string, any> = {};

    // Always capture steps if present
    if (resData?.result?.steps) {
      output.steps = resData.result.steps;
    }

    if (step === "step2" && resData?.result?.research) {
      output.research = resData.result.research;
    }

    // Store declared outputs
    for (const key of Object.keys(flow.outputSchema)) {
      if (resData?.result && resData.result[key] !== undefined) {
        output[key] = resData.result[key];
      }
    }

    console.log(`[v0] ${step} completed:`, output);

    return {
      success: true,
      stepId: step,
      stepName: flow.name,
      data: output,
    };
  } catch (error) {
    console.error(`[v0] Error executing ${step}:`, error);

    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Provide more specific error messages for common issues
      if (error.message.includes("fetch failed")) {
        errorMessage =
          "Network error: Unable to connect to the service. Please check your internet connection and try again.";
      } else if (error.message.includes("API key")) {
        errorMessage =
          "Authentication error: Please check your API configuration.";
      }
    }

    return {
      success: false,
      stepId: step,
      stepName: flows[step]?.name || step,
      error: errorMessage,
    };
  }
}

export async function* orchestratePipelineStepByStep(
  query: string,
  history: any[]
): AsyncGenerator<StepResult, void, unknown> {
  try {
    const results: Record<string, FlowResult> = {};

    // --- Topological sort by dependsOn ---
    const getExecutionOrder = (): string[] => {
      const order: string[] = [];
      const visited = new Set<string>();

      const visit = (stepId: string) => {
        if (visited.has(stepId)) return;
        visited.add(stepId);
        const flow = flows[stepId];
        if (flow.dependsOn) {
          for (const dep of flow.dependsOn) {
            visit(dep);
          }
        }
        order.push(stepId);
      };

      for (const stepId of Object.keys(flows)) {
        visit(stepId);
      }
      return order;
    };

    const executionOrder = getExecutionOrder();
    console.log("[v0] Execution order:", executionOrder);

    for (const stepId of executionOrder) {
      const flow = flows[stepId];
      console.log(`[v0] Executing ${stepId}: ${flow.name}`);

      const inputs: Record<string, any> = {};

      // Fill inputs based on schema
      for (const inputKey of Object.keys(flow.inputSchema)) {
        if (inputKey === "query") {
          inputs[inputKey] = query;
        } else if (inputKey === "history") {
          inputs[inputKey] = history;
        } else if (inputKey === "research" && stepId === "step3") {
          const step2Result = results["step2"];
          if (step2Result && step2Result.research) {
            inputs[inputKey] = step2Result.research;
          }
        } else if (flow.dependsOn) {
          // Try to map from dependency outputs
          for (const depId of flow.dependsOn) {
            const depResult = results[depId];
            if (depResult && depResult[inputKey] !== undefined) {
              inputs[inputKey] = depResult[inputKey];
              break;
            }
          }
        }
      }

      console.log(`[v0] ${stepId} inputs:`, inputs);

      try {
        const resData = await lamaticClient.executeFlow(
          flow.workflowId,
          inputs
        );
        console.log(`[v0] ${stepId} raw response:`, resData);

        const output: FlowResult = {};

        // Always capture steps if present
        if (resData?.result?.steps) {
          output.steps = resData.result.steps;
        }

        if (stepId === "step2" && resData?.result?.research) {
          output.research = resData.result.research;
        }

        // Store declared outputs
        for (const key of Object.keys(flow.outputSchema)) {
          if (resData?.result && resData.result[key] !== undefined) {
            output[key] = resData.result[key];
          }
        }

        results[stepId] = output;
        console.log(`[v0] ${stepId} completed:`, output);

        yield {
          stepId,
          stepName: flow.name,
          success: true,
          data: output,
        };
      } catch (error) {
        console.error(`[v0] Error executing ${stepId}:`, error);
        yield {
          stepId,
          stepName: flow.name,
          success: false,
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        };
        return;
      }
    }
  } catch (error) {
    console.error("[v0] Pipeline error:", error);
    yield {
      stepId: "pipeline",
      stepName: "Pipeline",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function orchestratePipeline(
  query: string,
  history: any[]
): Promise<{
  success: boolean;
  answer?: string;
  steps?: string;
  references?: string[];
  error?: string;
}> {
  try {
    const results: Record<string, FlowResult> = {};

    let finalAnswer = "";
    let stepTrace = "";
    let references: string[] = [];

    // --- Topological sort by dependsOn ---
    const getExecutionOrder = (): string[] => {
      const order: string[] = [];
      const visited = new Set<string>();

      const visit = (stepId: string) => {
        if (visited.has(stepId)) return;
        visited.add(stepId);
        const flow = flows[stepId];
        if (flow.dependsOn) {
          for (const dep of flow.dependsOn) {
            visit(dep);
          }
        }
        order.push(stepId);
      };

      for (const stepId of Object.keys(flows)) {
        visit(stepId);
      }
      return order;
    };

    const executionOrder = getExecutionOrder();
    console.log("[v0] Execution order:", executionOrder);

    for (const stepId of executionOrder) {
      const flow = flows[stepId];
      console.log(`[v0] Executing ${stepId}: ${flow.name}`);

      const inputs: Record<string, any> = {};

      // Fill inputs based on schema
      for (const inputKey of Object.keys(flow.inputSchema)) {
        if (inputKey === "query") {
          inputs[inputKey] = query;
        } else if (inputKey === "history") {
          inputs[inputKey] = history;
        } else if (inputKey === "research" && stepId === "step3") {
          const step2Result = results["step2"];
          if (step2Result && step2Result.research) {
            inputs[inputKey] = step2Result.research;
          }
        } else if (flow.dependsOn) {
          // Try to map from dependency outputs
          for (const depId of flow.dependsOn) {
            const depResult = results[depId];
            if (depResult && depResult[inputKey] !== undefined) {
              inputs[inputKey] = depResult[inputKey];
              break;
            }
          }
        }
      }

      console.log(`[v0] ${stepId} inputs:`, inputs);

      try {
        const resData = await lamaticClient.executeFlow(
          flow.workflowId,
          inputs
        );
        console.log(`[v0] ${stepId} raw response:`, resData);

        const output: FlowResult = {};

        // Always capture steps if present
        if (resData?.result?.steps) {
          output.steps = resData.result.steps;
          stepTrace = resData.result.steps;
        }

        if (stepId === "step2" && resData?.result?.research) {
          output.research = resData.result.research;
        }

        // Store declared outputs
        for (const key of Object.keys(flow.outputSchema)) {
          if (resData && resData.result && resData.result[key] !== undefined) {
            output[key] = resData.result[key];
          }
        }

        results[stepId] = output;

        // Post-process final fields
        if (output.links) {
          references = Array.isArray(output.links) ? output.links : [];
        }
        if (output.answer) {
          finalAnswer = output.answer;
        }

        console.log(`[v0] ${stepId} completed:`, output);
      } catch (error) {
        console.error(`[v0] Error executing ${stepId}:`, error);
        throw new Error(`Failed to execute ${flow.name}: ${error}`);
      }
    }

    return {
      success: true,
      answer: finalAnswer,
      steps: stepTrace,
      references: references,
    };
  } catch (error) {
    console.error("[v0] Pipeline error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
