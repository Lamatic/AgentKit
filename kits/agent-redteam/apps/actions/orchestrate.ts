"use server"

import lamaticConfig from "../../lamatic.config"
import { getLamaticClient } from "@/lib/lamatic-client"
import { computeSecurityAggregate, decodeHtmlEntities, mapWithConcurrency, parseJudgeVerdict } from "@/lib/eval"
import type { AttackCase, AttackResult, SecurityAggregate } from "@/lib/types"

// Serialized on purpose: each attack fires two sequential LLM calls (run-target, then
// judge), and free-tier provider keys have low per-minute limits. A security gate should
// prioritize reliability over speed — a flaky scan is worse than a slow one.
const CONCURRENCY = 1

// Upper bound on a single flow call so one stuck request can't hang the whole scan.
const FLOW_TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

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
  const resData = await withTimeout(getLamaticClient().executeFlow(flowId, inputs), FLOW_TIMEOUT_MS, `Flow ${flowId}`)
  const envelope = resData as { result?: { answer?: unknown }; answer?: unknown }
  const answer = envelope?.result?.answer ?? envelope?.answer
  if (answer === undefined || answer === null) {
    throw new Error("No answer returned from flow")
  }
  return answer
}

/** Fire one attack at the target prompt, then have the judge score whether the guardrail held. */
async function runAttack(
  systemPrompt: string,
  attack: AttackCase,
  flows: { judge: string; runTarget: string },
): Promise<AttackResult> {
  try {
    const rawResponse = await getAnswer(flows.runTarget, { systemPrompt, input: attack.payload })
    const response = decodeHtmlEntities(typeof rawResponse === "string" ? rawResponse : JSON.stringify(rawResponse))

    const rawJudge = await getAnswer(flows.judge, {
      category: attack.category,
      technique: attack.technique,
      payload: attack.payload,
      response,
      expectedSeverity: attack.expectedSeverityIfCompromised,
    })

    return { case: attack, response, judge: parseJudgeVerdict(rawJudge) }
  } catch (error) {
    return {
      case: attack,
      response: "",
      judge: null,
      error: error instanceof Error ? error.message : "Attack run failed",
    }
  }
}

/** Fire the attack battery at a system prompt and return the security gate verdict. */
export async function runRedTeamScan(
  systemPrompt: string,
  attacks: AttackCase[],
  threshold: number,
): Promise<{ success: boolean; data?: SecurityAggregate; error?: string }> {
  try {
    if (!systemPrompt.trim()) throw new Error("A system prompt is required")
    if (!Array.isArray(attacks) || attacks.length === 0) throw new Error("Select at least one attack")
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
      throw new Error("Threshold must be a number between 0 and 100")
    }

    const flows = { judge: resolveFlowId("judge"), runTarget: resolveFlowId("run-target") }
    const results = await mapWithConcurrency(attacks, CONCURRENCY, (attack) => runAttack(systemPrompt, attack, flows))
    return { success: true, data: computeSecurityAggregate(results, threshold) }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Red-team scan failed" }
  }
}
