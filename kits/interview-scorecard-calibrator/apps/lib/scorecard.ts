export const RECOMMENDATIONS = [
  "hire",
  "lean-hire",
  "lean-no",
  "no-hire",
] as const;

export const SEVERITIES = ["low", "medium", "high"] as const;

export type Recommendation = (typeof RECOMMENDATIONS)[number];
export type Severity = (typeof SEVERITIES)[number];

export type Competency = {
  name: string;
  weight: string;
  calibrated_score: number;
  evidence: string[];
  missing_evidence: string;
  interviewer_spread: string;
};

export type Disagreement = {
  topic: string;
  interviewers: string[];
  summary: string;
  severity: Severity;
};

export type Scorecard = {
  candidate_summary: string;
  competencies: Competency[];
  disagreements: Disagreement[];
  recommendation: Recommendation;
  confidence: number;
  rationale: string;
  follow_up_questions: string[];
  email_draft: string;
};

/** Type guard for plain objects. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Coerce unknown values to strings with an optional fallback. */
function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/** Validate that a value is an array of strings. */
function asStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((item) => typeof item === "string")) return null;
  return value;
}

/**
 * Parse and validate a calibrated scorecard payload from the Lamatic flow.
 * Returns null when the payload is missing required fields or has invalid shapes.
 */
export function parseScorecard(value: unknown): Scorecard | null {
  if (!isRecord(value)) return null;

  const recommendation = asString(value.recommendation).toLowerCase();
  if (!RECOMMENDATIONS.includes(recommendation as Recommendation)) return null;

  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return null;

  if (!Array.isArray(value.competencies) || !Array.isArray(value.disagreements)) {
    return null;
  }

  const competencies: Competency[] = [];
  for (const item of value.competencies) {
    if (!isRecord(item)) return null;
    const evidence = asStringArray(item.evidence);
    const score = Number(item.calibrated_score);
    if (!evidence) return null;
    if (!Number.isInteger(score) || score < 1 || score > 5) return null;
    competencies.push({
      name: asString(item.name, "Unnamed competency"),
      weight: asString(item.weight, "Medium"),
      calibrated_score: score,
      evidence,
      missing_evidence: asString(item.missing_evidence),
      interviewer_spread: asString(item.interviewer_spread),
    });
  }

  const disagreements: Disagreement[] = [];
  for (const item of value.disagreements) {
    if (!isRecord(item)) return null;
    const interviewers = asStringArray(item.interviewers);
    const severity = asString(item.severity).toLowerCase();
    if (!interviewers) return null;
    if (!SEVERITIES.includes(severity as Severity)) return null;
    disagreements.push({
      topic: asString(item.topic, "Untitled disagreement"),
      interviewers,
      summary: asString(item.summary),
      severity: severity as Severity,
    });
  }

  const followUps = asStringArray(value.follow_up_questions);
  if (!followUps) return null;

  return {
    candidate_summary: asString(value.candidate_summary),
    competencies,
    disagreements,
    recommendation: recommendation as Recommendation,
    confidence,
    rationale: asString(value.rationale),
    follow_up_questions: followUps,
    email_draft: asString(value.email_draft),
  };
}

/**
 * Split interviewer notes using the documented separators:
 * a `---` line and/or `Interviewer N:` / `Interviewer N (Name):` headings.
 */
export function splitInterviewerNotes(notes: string): string[] {
  return notes
    .split(/\n\s*-{3,}\s*\n|(?=^\s*Interviewer\s+\d+(?:\s*\([^)]*\))?\s*:)/im)
    .map((block) => block.trim())
    .filter(Boolean);
}
