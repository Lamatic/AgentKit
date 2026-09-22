/**
 * Report Assembler — Final aggregation node (no weight, combines all signals)
 *
 * Collects flags from all upstream detection nodes, applies a weighted scoring
 * formula, and emits the final structured trust report.
 *
 * Weighting:
 *   - Metadata flags:   30% of score contribution
 *   - OCR/Font flags:   30% of score contribution
 *   - ELA flags:        25% of score contribution
 *   - VLM flags:        15% of score contribution (runs last, highest fidelity but also highest latency/cost)
 *
 * Risk score thresholds:
 *   0–25  → Low risk (green)
 *   26–55 → Moderate risk (amber) — review recommended
 *   56–80 → High risk (orange) — strong review recommended
 *   81–100 → Critical risk (red) — do not trust without specialist review
 */

interface Flag {
  region: string;
  signal: "metadata" | "font_spacing" | "ela" | "vlm";
  confidence: number;
  explanation: string;
}

interface TrustReport {
  risk_score: number;
  verdict: string;
  verdict_color: "green" | "amber" | "orange" | "red";
  flags: Flag[];
  signal_breakdown: {
    metadata: { flags: number; score_contribution: number };
    font_spacing: { flags: number; score_contribution: number };
    ela: { flags: number; score_contribution: number };
    vlm: { flags: number; score_contribution: number };
  };
  document_info: {
    file_name: string;
    file_type: string;
    analyzed_at: string;
  };
  disclaimer: string;
}

/**
 * Computes a 0–100 signal score from an array of flags for a single detection
 * category. Averages flag confidences and applies a count boost (capped at 30%)
 * so that multiple corroborating flags increase suspicion appropriately.
 */
function signalScore(flags: Flag[]): number {
  if (flags.length === 0) return 0;
  // Average confidence of flags, boosted by count (more flags = higher suspicion, up to a cap)
  const avgConf = flags.reduce((sum, f) => sum + f.confidence, 0) / flags.length;
  const countBoost = Math.min(flags.length * 0.1, 0.3); // max 30% boost for multiple flags
  return Math.min(Math.round((avgConf + countBoost) * 100), 100);
}

/**
 * Maps a composite risk score (0–100) to a human-readable verdict string and a
 * colour code used in the trust report UI.
 * Thresholds: 0–25 → green, 26–55 → amber, 56–80 → orange, 81–100 → red.
 */
function getVerdict(score: number): { verdict: string; color: "green" | "amber" | "orange" | "red" } {
  if (score <= 25) return { verdict: "Low risk — no major anomalies detected. Document appears consistent.", color: "green" };
  if (score <= 55) return { verdict: "Moderate risk — review flagged regions before trusting this document.", color: "amber" };
  if (score <= 80) return { verdict: "High risk — multiple anomalies detected. Strongly recommend specialist review.", color: "orange" };
  return { verdict: "Critical risk — significant signs of tampering detected. Do not rely on this document without forensic verification.", color: "red" };
}

// Main execution
const metadataOutput = inputs.codeNode_metadata?.output ?? { flags: [] };
const ocrOutput = inputs.codeNode_ocr?.output ?? { flags: [] };
const elaOutput = inputs.codeNode_ela?.output ?? { flags: [], skipped: false };
const vlmRaw = inputs.LLMNode_vlm?.output?.answer ?? null;

const fileName: string = inputs.triggerNode_1?.output?.fileName ?? "Unknown";
const fileType: string = inputs.triggerNode_1?.output?.fileType ?? "Unknown";

// Parse and strictly validate VLM output (JSON string from LLM node)
let vlmFlags: Flag[] = [];
if (vlmRaw) {
  let parsed: any;
  try {
    parsed = typeof vlmRaw === "string" ? JSON.parse(vlmRaw) : vlmRaw;
  } catch (err: any) {
    throw new Error(`Malformed VLM JSON response: ${err?.message || "Invalid JSON"}`);
  }

  if (!parsed || !Array.isArray(parsed.vlm_flags)) {
    throw new Error("Invalid VLM analysis response: 'vlm_flags' must be an array.");
  }

  for (const f of parsed.vlm_flags) {
    if (typeof f.confidence !== "number" || isNaN(f.confidence) || f.confidence < 0 || f.confidence > 1) {
      throw new Error(`Invalid VLM flag confidence: ${f?.confidence}. Must be a number between 0.0 and 1.0.`);
    }
  }

  vlmFlags = parsed.vlm_flags
    .filter((f: any) => f.anomaly_detected === true)
    .map((f: any): Flag => ({
      region: f.region ?? "Unknown region",
      signal: "vlm",
      confidence: f.confidence,
      explanation: f.explanation ?? "Visual anomaly detected."
    }));
}

// Collect all flags
const metadataFlags: Flag[] = (metadataOutput.flags ?? []).map((f: any) => ({ ...f, signal: "metadata" as const }));
const ocrFlags: Flag[] = (ocrOutput.flags ?? []).map((f: any) => ({ ...f, signal: "font_spacing" as const }));
const elaFlags: Flag[] = (elaOutput.flags ?? []).map((f: any) => ({ ...f, signal: "ela" as const }));
const allFlags: Flag[] = [...metadataFlags, ...ocrFlags, ...elaFlags, ...vlmFlags];

// Detect which signals were skipped
const isMetadataSkipped = Boolean(metadataOutput.skipped);
const isOcrSkipped = Boolean(ocrOutput.skipped);
const isElaSkipped = Boolean(elaOutput.skipped);
const isVlmSkipped = !vlmRaw;

// Base signal weights (must sum to 1.0)
const BASE_WEIGHTS = { metadata: 0.30, ocr: 0.30, ela: 0.25, vlm: 0.15 };

// Determine completed signals and compute total active base weight
let totalActiveBaseWeight = 0;
if (!isMetadataSkipped) totalActiveBaseWeight += BASE_WEIGHTS.metadata;
if (!isOcrSkipped) totalActiveBaseWeight += BASE_WEIGHTS.ocr;
if (!isElaSkipped) totalActiveBaseWeight += BASE_WEIGHTS.ela;
if (!isVlmSkipped) totalActiveBaseWeight += BASE_WEIGHTS.vlm;

// Normalize weights proportionally across completed, non-skipped signals only
const metaWeight = (!isMetadataSkipped && totalActiveBaseWeight > 0) ? (BASE_WEIGHTS.metadata / totalActiveBaseWeight) : 0;
const ocrWeight = (!isOcrSkipped && totalActiveBaseWeight > 0) ? (BASE_WEIGHTS.ocr / totalActiveBaseWeight) : 0;
const elaWeight = (!isElaSkipped && totalActiveBaseWeight > 0) ? (BASE_WEIGHTS.ela / totalActiveBaseWeight) : 0;
const vlmWeight = (!isVlmSkipped && totalActiveBaseWeight > 0) ? (BASE_WEIGHTS.vlm / totalActiveBaseWeight) : 0;

// Compute per-signal scores (0 for skipped signals)
const metaScore = isMetadataSkipped ? 0 : signalScore(metadataFlags);
const ocrScore = isOcrSkipped ? 0 : signalScore(ocrFlags);
const elaScore = isElaSkipped ? 0 : signalScore(elaFlags);
const vlmScore = isVlmSkipped ? 0 : signalScore(vlmFlags);

const rawScore =
  metaScore * metaWeight +
  ocrScore * ocrWeight +
  elaScore * elaWeight +
  vlmScore * vlmWeight;

const risk_score = Math.min(Math.round(rawScore), 100);
const { verdict, color } = getVerdict(risk_score);

const report: TrustReport = {
  risk_score,
  verdict,
  verdict_color: color,
  flags: allFlags,
  signal_breakdown: {
    metadata: { flags: metadataFlags.length, score_contribution: Math.round(metaScore * metaWeight) },
    font_spacing: { flags: ocrFlags.length, score_contribution: Math.round(ocrScore * ocrWeight) },
    ela: { flags: elaFlags.length, score_contribution: Math.round(elaScore * elaWeight) },
    vlm: { flags: vlmFlags.length, score_contribution: Math.round(vlmScore * vlmWeight) }
  },
  document_info: {
    file_name: fileName,
    file_type: fileType,
    analyzed_at: new Date().toISOString()
  },
  disclaimer: "This is an automated first-pass triage tool, not a legal or forensic verdict. The risk score and flags are based on statistical heuristics and AI analysis, which can produce false positives and false negatives. Consult a qualified document examiner or forensic specialist for any high-stakes decision."
};

return report;
