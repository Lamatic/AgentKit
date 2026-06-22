"use server"

import { getFlowIds, getLamaticClient } from "@/lib/lamatic-client"
import { computeAggregate, decodeHtmlEntities, mapWithConcurrency, parseJudgeResult } from "@/lib/eval"
import type { CaseResult, GoldenCase, RunAggregate } from "@/lib/types"

// Bounded concurrency keeps large golden sets from tripping Groq rate limits.
const CONCURRENCY = 3

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
async function evaluateCase(systemPrompt: string, testCase: GoldenCase): Promise<CaseResult> {
  const { judge, runTarget } = getFlowIds()
  try {
    const rawOutput = await getAnswer(runTarget, { systemPrompt, input: testCase.input })
    const output = decodeHtmlEntities(typeof rawOutput === "string" ? rawOutput : JSON.stringify(rawOutput))

    const rawJudge = await getAnswer(judge, {
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

    const results = await mapWithConcurrency(cases, CONCURRENCY, (testCase) =>
      evaluateCase(systemPrompt, testCase),
    )
    return { success: true, data: computeAggregate(results, threshold) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Evaluation failed" }
  }
}
