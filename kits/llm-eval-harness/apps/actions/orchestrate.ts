"use server"

import lamaticConfig from "../../lamatic.config"
import { getLamaticClient } from "@/lib/lamatic-client"
import { computeAggregate, decodeHtmlEntities, mapWithConcurrency, parseJudgeResult } from "@/lib/eval"
import type { CaseResult, GoldenCase, RunAggregate } from "@/lib/types"

// Bounded concurrency keeps large golden sets from tripping Groq rate limits.
const CONCURRENCY = 3

/** Resolve a deployed flow ID from the kit's lamatic.config step definitions. */
function resolveFlowId(stepId: string): string {
  const step = lamaticConfig.steps.find((s) => s.id === stepId)
  if (!step?.envKey) {
    throw new Error(`lamatic.config has no step "${stepId}" with an envKey`)
  }
  const value = process.env[step.envKey]
  if (!value) {
    throw new Error(`Missing environment variable "${step.envKey}" for flow "${stepId}"`)
  }
  return value
}

/** Execute a flow and pull the `answer` field out of the Lamatic response. */
async function getAnswer(flowId: string, inputs: Record<string, unknown>): Promise<unknown> {
  const resData = await getLamaticClient().executeFlow(flowId, inputs)
  const envelope = resData as { result?: { answer?: unknown }; answer?: unknown }
  const answer = envelope?.result?.answer ?? envelope?.answer
  if (answer === undefined || answer === null) {
    throw new Error("No answer returned from flow")
  }
  return answer
}

/** Run one golden case through run-target, then score it with the judge. */
async function evaluateCase(
  systemPrompt: string,
  testCase: GoldenCase,
  flows: { judge: string; runTarget: string },
): Promise<CaseResult> {
  try {
    const rawOutput = await getAnswer(flows.runTarget, { systemPrompt, input: testCase.input })
    const output = decodeHtmlEntities(typeof rawOutput === "string" ? rawOutput : JSON.stringify(rawOutput))

    const rawJudge = await getAnswer(flows.judge, {
      input: testCase.input,
      output,
      criteria: testCase.criteria,
      reference: testCase.reference ?? "",
    })

    return { case: testCase, output, judge: parseJudgeResult(rawJudge) }
  } catch (error) {
    return {
      case: testCase,
      output: "",
      judge: null,
      error: error instanceof Error ? error.message : "Evaluation failed",
    }
  }
}

/** Evaluate a system prompt against a golden set and return the gate verdict. */
export async function runEvaluation(
  systemPrompt: string,
  cases: GoldenCase[],
  threshold: number,
): Promise<{ success: boolean; data?: RunAggregate; error?: string }> {
  try {
    if (!systemPrompt.trim()) throw new Error("A system prompt is required")
    if (!Array.isArray(cases) || cases.length === 0) throw new Error("Provide at least one test case")
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      throw new Error("Threshold must be a number between 0 and 100")
    }

    const flows = { judge: resolveFlowId("judge"), runTarget: resolveFlowId("run-target") }
    const results = await mapWithConcurrency(cases, CONCURRENCY, (testCase) =>
      evaluateCase(systemPrompt, testCase, flows),
    )
    return { success: true, data: computeAggregate(results, threshold) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Evaluation failed" }
  }
}
