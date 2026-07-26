// Pure helpers — the defensively-parsed core of the app. No I/O here, so this is
// the part worth reasoning about carefully (and unit-testing).

import type { Confidence, Hypothesis, InvestigationResult } from "./types";

/** InstructorLLMNode fields can arrive as objects or as JSON strings. Coerce safely. */
export function coerceJson<T>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === "object") return value as T;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      // Tolerate ```json fenced blocks the model sometimes adds.
      const unfenced = trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      return JSON.parse(unfenced) as T;
    } catch {
      return null;
    }
  }
  return null;
}

const CONFIDENCE_ORDER: Record<Confidence, number> = { high: 0, medium: 1, low: 2 };

function normalizeConfidence(value: unknown): Confidence {
  const c = String(value ?? "").toLowerCase();
  return c === "high" || c === "medium" || c === "low" ? c : "low";
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

/** Normalize one hypothesis from raw flow output into a safe, fully-populated shape. */
function normalizeHypothesis(raw: unknown, index: number): Hypothesis {
  const h = (raw ?? {}) as Record<string, unknown>;
  const contradicting = asStringArray(h.contradictingEvidence);
  return {
    rank: typeof h.rank === "number" ? h.rank : index + 1,
    title: String(h.title ?? "Untitled hypothesis"),
    confidence: normalizeConfidence(h.confidence),
    reasoning: String(h.reasoning ?? ""),
    supportingEvidence: asStringArray(h.supportingEvidence),
    // Preserve the constitution's rule: an empty list becomes the explicit statement.
    contradictingEvidence:
      contradicting.length > 0 ? contradicting : ["No contradicting evidence found."],
    nextStep: String(h.nextStep ?? "")
  };
}

/**
 * Parse the raw `investigate` flow response into a clean InvestigationResult.
 * Sorts hypotheses by rank, then by confidence as a tiebreak. Never throws.
 */
export function parseInvestigation(raw: unknown): InvestigationResult {
  const obj = coerceJson<Record<string, unknown>>(raw) ?? {};
  // `hypotheses` may arrive as an array, or as a nested JSON string from the model.
  const coerced = Array.isArray(obj.hypotheses) ? obj.hypotheses : coerceJson<unknown>(obj.hypotheses);
  const rawHypotheses = Array.isArray(coerced) ? coerced : [];

  const hypotheses = rawHypotheses
    .map(normalizeHypothesis)
    .sort((a, b) => a.rank - b.rank || CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]);

  return {
    summary: String(obj.summary ?? ""),
    // Tolerate boolean true or the string "true" from structured output.
    insufficientInfo: obj.insufficientInfo === true || obj.insufficientInfo === "true",
    hypotheses
  };
}

/** Flatten one hypothesis's evidence into the text block the draft-comms flow expects. */
export function evidenceBlock(h: Hypothesis): string {
  const support = h.supportingEvidence.map((e) => `+ ${e}`).join("\n");
  const against = h.contradictingEvidence.map((e) => `- ${e}`).join("\n");
  return `Supporting:\n${support}\n\nContradicting:\n${against}`;
}

/** One-line-per-hypothesis summary for the draft-comms "full ranked list" input. */
export function rankedList(hypotheses: Hypothesis[]): string {
  return hypotheses
    .map((h) => `${h.rank}. ${h.title} (${h.confidence}) — next: ${h.nextStep}`)
    .join("\n");
}

/** Tailwind-ready badge classes for a confidence level. */
export function confidenceBadge(c: Confidence): { label: string; className: string } {
  switch (c) {
    case "high":
      return { label: "High confidence", className: "badge badge-high" };
    case "medium":
      return { label: "Medium confidence", className: "badge badge-medium" };
    default:
      return { label: "Low confidence", className: "badge badge-low" };
  }
}
