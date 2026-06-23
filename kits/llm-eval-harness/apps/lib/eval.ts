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

function buildJudgeResult(obj: Record<string, unknown>): JudgeResult {
  const faithfulness = clampScore(obj.faithfulness)
  const relevancy = clampScore(obj.relevancy)
  const correctness = clampScore(obj.correctness)
  const overall = Math.round(((faithfulness + relevancy + correctness) / 3) * 10) / 10
  const pass = overall >= 3.5 && faithfulness >= 3
  const reasoning = typeof obj.reasoning === "string" ? obj.reasoning : ""
  return { faithfulness, relevancy, correctness, overall, pass, reasoning }
}

/**
 * Last-resort extraction for when the judge emits invalid JSON (e.g. an
 * unescaped quote inside `reasoning`). Pulls the fixed schema's fields out
 * with regex so a malformed-but-present verdict is still usable.
 */
function extractJudgeFields(text: string): JudgeResult | null {
  const num = (key: string): number | null => {
    const m = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+(?:\\.\\d+)?)`, "i"))
    return m ? clampScore(m[1]) : null
  }
  const faithfulness = num("faithfulness")
  const relevancy = num("relevancy")
  const correctness = num("correctness")
  if (faithfulness === null || relevancy === null || correctness === null) return null

  const reasoningMatch = text.match(/"reasoning"\s*:\s*"([\s\S]*?)"\s*[},]/)
  return buildJudgeResult({
    faithfulness,
    relevancy,
    correctness,
    reasoning: reasoningMatch ? reasoningMatch[1] : "",
  })
}

/**
 * Defensively turn the judge flow's `answer` into a JudgeResult.
 * Accepts an already-parsed object, a (possibly fenced) JSON string, or even
 * slightly-malformed JSON. Overall and pass are recomputed from the dimensions
 * so the gate logic is enforced app-side regardless of the model's arithmetic.
 */
export function parseJudgeResult(raw: unknown): JudgeResult {
  // 1. Lamatic already parsed the JSON into an object.
  if (raw && typeof raw === "object") {
    return buildJudgeResult(raw as Record<string, unknown>)
  }
  if (typeof raw !== "string") {
    throw new Error("Judge returned an empty response")
  }

  const cleaned = stripCodeFences(raw)

  // 2. Try strict JSON: the whole string, then the first {...} block.
  for (const candidate of [cleaned, cleaned.match(/\{[\s\S]*\}/)?.[0]]) {
    if (!candidate) continue
    try {
      return buildJudgeResult(JSON.parse(candidate) as Record<string, unknown>)
    } catch {
      // fall through to field extraction
    }
  }

  // 3. Invalid JSON — recover the fields directly.
  const extracted = extractJudgeFields(cleaned)
  if (extracted) return extracted

  throw new Error("Judge did not return parseable output")
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
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Concurrency limit must be a positive integer")
  }
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
