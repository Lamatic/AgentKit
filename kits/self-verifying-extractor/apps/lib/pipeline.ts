export const CONFIDENCE_THRESHOLD = 0.7;
export const MAX_DOCUMENT_CHARACTERS = 50_000;

export type VerificationValue = string | string[] | number | boolean | null;
export type Verdict = "supported" | "ambiguous" | "unsupported";
export type Routing = "verified" | "review" | "not_found";

export interface FieldVerdict {
  field: string;
  value: VerificationValue;
  verdict: Verdict;
  confidence: number;
  source_quote: string;
  reason: string;
  model_verdict?: Verdict;
  evidence_validated: boolean;
  simulated?: boolean;
  source_page?: number | null;
}

// For PDF-sourced documents the text carries `--- Page N ---` markers. Given an
// exact source quote, find which page it falls on — deterministically, from the
// marker preceding the quote's position. Returns null for pasted text (no markers)
// or when the quote is absent.
export function derivePage(document: string, quote: string): number | null {
  if (!quote) return null;
  const index = document.indexOf(quote);
  if (index < 0) return null;
  const markers = document.slice(0, index).match(/--- Page (\d+) ---/g);
  if (!markers || markers.length === 0) return null;
  const last = markers[markers.length - 1].match(/--- Page (\d+) ---/);
  return last ? Number(last[1]) : null;
}

export interface PipelineSummary {
  total: number;
  verified_count: number;
  needs_review_count: number;
  not_found_count: number;
}

export interface RoutedVerifications {
  verified: FieldVerdict[];
  needsReview: FieldVerdict[];
  notFound: FieldVerdict[];
  summary: PipelineSummary;
  report: string;
}

export interface SimulatedError {
  field: string;
  original: string;
  corrupted: string;
}

const EXPECTED_EXTRACTION_FIELDS = [
  "document_type",
  "vendor_or_sender",
  "total_amount",
  "due_date",
  "account_or_invoice_number",
  "key_terms",
] as const;

type ExpectedExtractionField = (typeof EXPECTED_EXTRACTION_FIELDS)[number];
export type Extraction = Record<ExpectedExtractionField, string | string[] | null>;

// Fields the deterministic error simulator may corrupt, in priority order. Each
// must be a scalar string containing digits so a single-digit misread is possible.
const SIMULATION_FIELDS: ExpectedExtractionField[] = [
  "due_date",
  "total_amount",
  "account_or_invoice_number",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeBasicEntities(value: string): string {
  return value
    .replaceAll("&#039;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripJsonFence(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseJson(raw: string, label: string): unknown {
  try {
    return JSON.parse(stripJsonFence(raw));
  } catch {
    throw new Error(`${label} returned malformed JSON.`);
  }
}

export function parseObjectPayload(value: unknown, label: string): Record<string, unknown> {
  const parsed = typeof value === "string" ? parseJson(value, label) : value;
  if (!isRecord(parsed)) {
    throw new Error(`${label} did not return a JSON object.`);
  }
  return parsed;
}

export interface FlowResponse {
  status?: string;
  statusCode?: number | string;
  message?: string;
  result?: unknown;
}

/**
 * Validates a raw Lamatic flow response and returns its parsed object payload.
 * Fails closed: a non-success status, an absent result, or a non-object payload
 * all throw rather than letting the pipeline continue on bad data.
 */
export function assertFlowSuccess(
  response: FlowResponse,
  flowName: string,
): Record<string, unknown> {
  if (response.status !== "success") {
    throw new Error(
      `${flowName} failed${response.statusCode ? ` (${response.statusCode})` : ""}: ${response.message || "Lamatic returned an error."}`,
    );
  }
  if (response.result === null || response.result === undefined) {
    throw new Error(`${flowName} returned no result.`);
  }
  return parseObjectPayload(response.result, `${flowName} flow`);
}

export function validateExtraction(value: unknown): Extraction {
  const candidate = parseObjectPayload(value, "Extract flow");

  if (typeof candidate.error === "string") {
    throw new Error(`Extract flow failed: ${candidate.error}`);
  }

  const missing = EXPECTED_EXTRACTION_FIELDS.filter((field) => !(field in candidate));
  if (missing.length > 0) {
    throw new Error(`Extract flow omitted required fields: ${missing.join(", ")}.`);
  }

  const extraction = {} as Extraction;
  for (const field of EXPECTED_EXTRACTION_FIELDS) {
    const fieldValue = candidate[field];
    if (field === "key_terms") {
      if (
        !Array.isArray(fieldValue) ||
        !fieldValue.every((term) => typeof term === "string")
      ) {
        throw new Error("Extract flow returned key_terms in an invalid format.");
      }
      extraction[field] = fieldValue.map((term) => term.trim()).filter(Boolean);
      continue;
    }

    if (fieldValue !== null && typeof fieldValue !== "string") {
      throw new Error(`Extract flow returned ${field} in an invalid format.`);
    }
    extraction[field] = typeof fieldValue === "string" ? fieldValue.trim() : null;
  }

  return extraction;
}

// ── Deterministic extraction-error simulation ─────────────────────────────────
// Honest demo aid: deliberately corrupts one extracted scalar (a single-digit
// "misread") so the verifier has a concrete error to catch. The corrupted value
// is guaranteed to differ from the original AND to be absent from the document,
// so verification must route it to review. Nothing here pretends the model
// naturally erred — the caller surfaces the change explicitly in the UI.

function corruptScalarValue(value: string, document: string): string | null {
  const runs = [...value.matchAll(/\d+/g)];
  if (runs.length === 0) return null;

  // Prefer a non-year run (day/month/amount) so the corruption reads as a
  // realistic date/amount misread rather than an off-by-one year.
  const nonYearRuns = runs.filter((run) => run[0].length !== 4);
  const candidateRuns = nonYearRuns.length > 0 ? nonYearRuns : runs;
  const target = candidateRuns[candidateRuns.length - 1];
  const targetRun = target[0];
  const runStart = target.index ?? value.indexOf(targetRun);

  const replacementDigits = ["5", "8", "1", "2", "3", "9", "0", "4", "6", "7"];
  // Walk digits of the target run right-to-left; swap the first one that yields a
  // value not present in the document.
  for (let offset = targetRun.length - 1; offset >= 0; offset -= 1) {
    const position = runStart + offset;
    const current = value[position];
    for (const replacement of replacementDigits) {
      if (replacement === current) continue;
      const candidate = value.slice(0, position) + replacement + value.slice(position + 1);
      if (candidate !== value && !document.includes(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}

export function simulateExtractionError(
  document: string,
  extraction: Extraction,
): { extraction: Extraction; change: SimulatedError | null } {
  for (const field of SIMULATION_FIELDS) {
    const value = extraction[field];
    if (typeof value === "string" && /\d/.test(value)) {
      const corrupted = corruptScalarValue(value, document);
      if (corrupted && corrupted !== value) {
        return {
          extraction: { ...extraction, [field]: corrupted },
          change: { field, original: value, corrupted },
        };
      }
    }
  }
  return { extraction, change: null };
}

// ── Verification parsing & normalization ──────────────────────────────────────

function parseVerificationArray(value: unknown): unknown[] {
  const parsed = typeof value === "string" ? parseJson(value, "Verify flow") : value;
  if (Array.isArray(parsed)) return parsed;
  if (isRecord(parsed) && Array.isArray(parsed.verifications)) return parsed.verifications;
  throw new Error("Verify flow did not return a verification array.");
}

function parseValue(value: unknown, field: string): VerificationValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return typeof value === "string" ? decodeBasicEntities(value) : value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.map((item) => decodeBasicEntities(item));
  }
  throw new Error(`Verify flow returned an invalid value for ${field}.`);
}

function parseVerdict(value: unknown, field: string): Verdict {
  if (value === "supported" || value === "ambiguous" || value === "unsupported") {
    return value;
  }
  throw new Error(`Verify flow returned an invalid verdict for ${field}.`);
}

function normalizeVerification(value: unknown): FieldVerdict {
  if (!isRecord(value) || typeof value.field !== "string" || !value.field.trim()) {
    throw new Error("Verify flow returned a verdict without a valid field name.");
  }

  const field = value.field.trim();
  const confidence = value.confidence;
  if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
    throw new Error(`Verify flow returned an invalid confidence for ${field}.`);
  }

  return {
    field,
    value: parseValue(value.value, field),
    verdict: parseVerdict(value.verdict, field),
    confidence: Math.min(1, Math.max(0, confidence)),
    source_quote:
      typeof value.source_quote === "string" ? decodeBasicEntities(value.source_quote) : "",
    reason: typeof value.reason === "string" ? decodeBasicEntities(value.reason) : "",
    evidence_validated: false,
  };
}

/** Normalize and de-duplicate the raw verify output. No document/evidence yet. */
export function validateVerifications(value: unknown): FieldVerdict[] {
  const parsed = parseVerificationArray(value);
  if (parsed.length === 0) throw new Error("Verify flow returned no field verdicts.");

  const seen = new Set<string>();
  return parsed.map((item) => {
    const normalized = normalizeVerification(item);
    if (seen.has(normalized.field)) {
      throw new Error(`Verify flow returned duplicate verdicts for ${normalized.field}.`);
    }
    seen.add(normalized.field);
    return normalized;
  });
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

export function assertVerificationCoverage(
  extraction: Extraction,
  verifications: FieldVerdict[],
): void {
  const returnedFields = new Set(verifications.map((item) => item.field));
  const missing = EXPECTED_EXTRACTION_FIELDS.filter((field) => !returnedFields.has(field));
  const unexpected = verifications
    .map((item) => item.field)
    .filter((field) => !EXPECTED_EXTRACTION_FIELDS.includes(field as ExpectedExtractionField));

  if (missing.length > 0) {
    throw new Error(`Verify flow omitted required fields: ${missing.join(", ")}.`);
  }
  if (unexpected.length > 0) {
    throw new Error(`Verify flow returned unexpected fields: ${unexpected.join(", ")}.`);
  }

  for (const item of verifications) {
    const expectedValue = extraction[item.field as ExpectedExtractionField];
    // Order-insensitive for array fields so a re-ordered key_terms list does not
    // hard-fail the run; identity of the set of values is what matters.
    if (!valuesEqual(item.value, expectedValue)) {
      throw new Error(`Verify flow changed the extracted value for ${item.field}.`);
    }
  }
}

// ── Evidence gate ─────────────────────────────────────────────────────────────

// Scalar grounding only — array fields are expanded into per-item scalar verdicts
// before evidence validation, so this never receives an array.
function valueIsGrounded(value: VerificationValue, quote: string): boolean {
  if (value === null || Array.isArray(value)) return false;
  return quote.includes(String(value));
}

function downgrade(verdict: FieldVerdict, reason: string): FieldVerdict {
  return {
    ...verdict,
    model_verdict: verdict.verdict,
    verdict: "ambiguous",
    reason: verdict.reason
      ? `${verdict.reason} Deterministic check: ${reason}`
      : `Deterministic check: ${reason}`,
    evidence_validated: false,
  };
}

export function validateEvidence(document: string, verdict: FieldVerdict): FieldVerdict {
  if (verdict.verdict !== "supported") return verdict;
  if (verdict.confidence < CONFIDENCE_THRESHOLD) {
    return downgrade(verdict, "model confidence was below the verification threshold.");
  }
  if (verdict.value === null) {
    return downgrade(verdict, "an absent value has no exact supporting span.");
  }
  if (!verdict.source_quote) {
    return downgrade(verdict, "the model supplied no source quote.");
  }
  if (!document.includes(verdict.source_quote)) {
    return downgrade(verdict, "the claimed source quote is not an exact substring of the document.");
  }
  if (!valueIsGrounded(verdict.value, verdict.source_quote)) {
    return downgrade(verdict, "the extracted value is not present verbatim in the source quote.");
  }
  return {
    ...verdict,
    evidence_validated: true,
    source_page: derivePage(document, verdict.source_quote),
  };
}

// A key_terms item is defined (by the extract contract) as an exact span copied
// from the document, so its verification is purely deterministic: does this exact
// span appear verbatim in the source? The app owns that check outright rather than
// deferring to the verifier's array-level verdict — the LLM sometimes marks a
// present term "ambiguous" by reasoning about whether it is really a *key* term,
// which is not the question. Presence is proven in code; model confidence is
// advisory. (Scalars keep the conservative gate below: the app only ever
// downgrades them, never upgrades.)
function groundListItem(
  document: string,
  parent: FieldVerdict,
  item: string,
  index: number,
): FieldVerdict {
  const field = `${parent.field} [${index + 1}]`;
  const grounded = item.length > 0 && document.includes(item);
  if (grounded) {
    return {
      ...parent,
      field,
      value: item,
      source_quote: item,
      verdict: "supported",
      model_verdict: parent.verdict,
      confidence: 1,
      reason: "",
      evidence_validated: true,
      source_page: derivePage(document, item),
    };
  }
  return {
    ...parent,
    field,
    value: item,
    source_quote: "",
    verdict: "unsupported",
    model_verdict: parent.verdict,
    confidence: 0,
    reason: `"${item}" does not appear verbatim in the document.`,
    evidence_validated: false,
  };
}

/**
 * Expands array-valued fields (key_terms) into one verdict per item so each term
 * is grounded and routed independently — a real term verifies even when it sits
 * far from the others in the document, and a single hallucinated term is flagged
 * on its own without dragging the real ones into review. Scalars pass through the
 * conservative evidence gate unchanged.
 */
export function expandAndValidate(
  document: string,
  verifications: FieldVerdict[],
): FieldVerdict[] {
  const processed: FieldVerdict[] = [];
  for (const verdict of verifications) {
    if (Array.isArray(verdict.value)) {
      if (verdict.value.length === 0) {
        // No terms extracted: account for the field as absent (Not found).
        processed.push({
          ...verdict,
          value: null,
          source_quote: "",
          verdict: "unsupported",
          model_verdict: verdict.verdict,
          confidence: 0,
          reason: verdict.reason || "No key terms were extracted.",
          evidence_validated: false,
        });
        continue;
      }
      verdict.value.forEach((item, index) => {
        processed.push(groundListItem(document, verdict, item, index));
      });
      continue;
    }
    processed.push(validateEvidence(document, verdict));
  }
  return processed;
}

// ── Routing & report ──────────────────────────────────────────────────────────

export function routeVerifications(processed: FieldVerdict[]): RoutedVerifications {
  const verified = processed.filter((item) => item.evidence_validated);
  const notFound = processed.filter((item) => !item.evidence_validated && item.value === null);
  const needsReview = processed.filter(
    (item) => !item.evidence_validated && item.value !== null,
  );

  const summary: PipelineSummary = {
    total: processed.length,
    verified_count: verified.length,
    needs_review_count: needsReview.length,
    not_found_count: notFound.length,
  };
  return { verified, needsReview, notFound, summary, report: buildReport(verified, needsReview, notFound) };
}

function displayValue(value: VerificationValue): string {
  if (value === null) return "—";
  return Array.isArray(value) ? value.join("; ") : String(value);
}

function label(field: string): string {
  return field.replace(/_/g, " ");
}

function percent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

function buildReport(
  verified: FieldVerdict[],
  needsReview: FieldVerdict[],
  notFound: FieldVerdict[],
): string {
  let report = `## Verified (${verified.length})\n\n`;
  report += verified.length
    ? verified
        .map(
          (item) =>
            `- **${label(item.field)}:** ${displayValue(item.value)}  \n  _Confidence ${percent(item.confidence)} · exact evidence:_ "${item.source_quote}"`,
        )
        .join("\n") + "\n\n"
    : "_Nothing passed deterministic evidence validation._\n\n";

  report += `## Needs your review (${needsReview.length})\n\n`;
  report += needsReview.length
    ? needsReview
        .map(
          (item) =>
            `- **${label(item.field)}:** ${displayValue(item.value)} — _${item.verdict}, model confidence ${percent(item.confidence)}_  \n  ${item.reason || "Could not be confirmed against the source text."}`,
        )
        .join("\n") + "\n\n"
    : "_Every extracted field passed deterministic evidence validation._\n\n";

  report += `## Not found (${notFound.length})\n\n`;
  report += notFound.length
    ? notFound
        .map((item) => `- **${label(item.field)}:** not present in the document.`)
        .join("\n") + "\n"
    : "_Every expected field was present in the document._\n";
  return report;
}

// ── Report-flow cross-check ───────────────────────────────────────────────────

export function parseReportArray(value: unknown, field: string): FieldVerdict[] {
  const parsed = typeof value === "string" ? parseJson(value, `Report flow ${field}`) : value;
  if (!Array.isArray(parsed)) throw new Error(`Report flow returned ${field} in an invalid format.`);
  return parsed.map(normalizeVerification);
}

function verdictIdentity(item: FieldVerdict): string {
  return `${item.field}:${JSON.stringify(item.value)}`;
}

function sortedIdentities(items: FieldVerdict[]): string {
  return JSON.stringify(items.map(verdictIdentity).sort());
}

export function assertReportMatches(
  expected: RoutedVerifications,
  reportOutput: Record<string, unknown>,
): void {
  const buckets: [keyof RoutedVerifications, string][] = [
    ["verified", "verified"],
    ["needsReview", "needs_review"],
    ["notFound", "not_found"],
  ];
  for (const [expectedKey, outputKey] of buckets) {
    const actual = parseReportArray(reportOutput[outputKey], outputKey);
    const expectedBucket = expected[expectedKey] as FieldVerdict[];
    if (sortedIdentities(actual) !== sortedIdentities(expectedBucket)) {
      throw new Error(`Report flow disagreed with deterministic ${outputKey} routing.`);
    }
  }
}
