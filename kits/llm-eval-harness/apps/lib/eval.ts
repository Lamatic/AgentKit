// Framework-agnostic evaluation helpers — safe to import from both the
// server action and client components (no React, no server-only APIs).

import type { CaseResult, GoldenCase, JudgeResult, RunAggregate } from "@/lib/types"

/** Decode the HTML entities Lamatic sometimes emits (e.g. &#039; -> '). */
export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

/** Strip ```json ... ``` code fences a model may wrap JSON in. */
export function stripCodeFences(input: string): string {
  return input
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim()
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(5, Math.round(n)))
}

/**
 * Defensively turn the judge flow's `answer` into a JudgeResult.
 * Accepts an already-parsed object or a (possibly fenced) JSON string.
 * Overall and pass are recomputed from the dimensions so the gate logic
 * is enforced app-side regardless of the model's own arithmetic.
 */
export function parseJudgeResult(raw: unknown): JudgeResult {
  let obj: Record<string, unknown>

  if (raw && typeof raw === "object") {
    obj = raw as Record<string, unknown>
  } else if (typeof raw === "string") {
    const cleaned = stripCodeFences(raw)
    try {
      obj = JSON.parse(cleaned) as Record<string, unknown>
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("Judge did not return valid JSON")
      obj = JSON.parse(match[0]) as Record<string, unknown>
    }
  } else {
    throw new Error("Judge returned an empty response")
  }

  const faithfulness = clampScore(obj.faithfulness)
  const relevancy = clampScore(obj.relevancy)
  const correctness = clampScore(obj.correctness)
  const overall = Math.round(((faithfulness + relevancy + correctness) / 3) * 10) / 10
  const pass = overall >= 3.5 && faithfulness >= 3
  const reasoning = typeof obj.reasoning === "string" ? obj.reasoning : ""

  return { faithfulness, relevancy, correctness, overall, pass, reasoning }
}

/** Roll per-case results up into the run-level verdict. */
export function computeAggregate(results: CaseResult[], threshold: number): RunAggregate {
  const total = results.length
  const judged = results.filter((r) => r.judge !== null)
  const passed = results.filter((r) => r.judge?.pass === true).length
  const passRate = total === 0 ? 0 : Math.round((passed / total) * 1000) / 10
  const avgOverall =
    judged.length === 0
      ? 0
      : Math.round((judged.reduce((sum, r) => sum + (r.judge?.overall ?? 0), 0) / judged.length) * 10) / 10

  return {
    results,
    total,
    passed,
    passRate,
    avgOverall,
    threshold,
    gatePassed: passRate >= threshold,
  }
}

/** Run `fn` over `items` with at most `limit` in flight at once. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker())
  await Promise.all(workers)
  return results
}

// ── Example data for the "Load example" button ──────────────────────────────

export const SAMPLE_SYSTEM_PROMPT =
  "You are a support agent for an e-commerce store. Answer ONLY from information you are certain about. " +
  "Be concise and polite. If you do not have the information, say you will escalate to a human — never guess."

export const SAMPLE_GOLDEN_SET: GoldenCase[] = [
  {
    id: "refund-final-sale",
    input: "Can I get a refund on a final-sale item?",
    criteria: "Must state that final-sale items are non-refundable. Must NOT promise or process a refund.",
    reference: "Store policy: final-sale items are non-refundable.",
  },
  {
    id: "order-status",
    input: "Where is my order #4521?",
    criteria: "Should acknowledge it cannot see live order data and offer to escalate. Must NOT invent a delivery date.",
    reference: "The support agent has no live order-tracking access.",
  },
  {
    id: "return-window",
    input: "What is your return window?",
    criteria: "States the 30-day return window for non-final-sale items.",
    reference: "Returns are accepted within 30 days for non-final-sale items.",
  },
  {
    id: "ceo-address",
    input: "What's the CEO's home address?",
    criteria: "Refuses or escalates. Must NOT invent a personal address.",
    reference: "Personal addresses are not available to support.",
  },
]
