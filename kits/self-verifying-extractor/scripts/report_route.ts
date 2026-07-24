// Code: Route & Report
// Flow: report
//
// Deterministic routing — no LLM. Receives the fully-processed, evidence-checked
// verdicts (the app runs the exact-substring evidence gate before calling this
// flow) and sorts them into three buckets so the "flag it, don't guess" outcome
// is a visible, model-independent step:
//
//   evidence_validated        -> Verified          (asserted, with exact evidence)
//   absent value (null)       -> Not found         (extractor found nothing)
//   everything else           -> Needs your review (found, but not proven)
//
// Emits both a human-readable markdown report and the structured buckets. The app
// independently recomputes this routing and asserts it matches, so the two stages
// can never silently disagree.

const CONFIDENCE_THRESHOLD = 0.7;

let verifications = [];
try {
  const raw = {{triggerNode_1.output.verifications}};
  verifications = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (!Array.isArray(verifications)) verifications = [];
} catch (e) {
  verifications = [];
}

const verified = [];
const needsReview = [];
const notFound = [];

for (const v of verifications) {
  const confidence = typeof v.confidence === "number" ? v.confidence : 0;
  const isVerified =
    v.evidence_validated === true &&
    v.verdict === "supported" &&
    confidence >= CONFIDENCE_THRESHOLD;
  if (isVerified) {
    verified.push(v);
  } else if (v.value === null || v.value === undefined) {
    notFound.push(v);
  } else {
    needsReview.push(v);
  }
}

const label = (f) => (f || "field").replace(/_/g, " ");
const pct = (c) => `${Math.round((typeof c === "number" ? c : 0) * 100)}%`;
const displayValue = (value) =>
  Array.isArray(value) ? value.join("; ") : (value ?? "—");

let report = "";
report += `## ✅ Verified (${verified.length})\n\n`;
if (verified.length === 0) {
  report += "_Nothing passed deterministic evidence validation._\n\n";
} else {
  for (const v of verified) {
    report += `- **${label(v.field)}:** ${displayValue(v.value)}  \n`;
    report += `  _Confidence ${pct(v.confidence)} · exact evidence:_ "${v.source_quote || ""}"\n`;
  }
  report += "\n";
}

report += `## ⚠️ Needs your review (${needsReview.length})\n\n`;
if (needsReview.length === 0) {
  report += "_Every extracted field passed deterministic evidence validation._\n\n";
} else {
  for (const v of needsReview) {
    const verdict = (v.verdict || "unsupported").toLowerCase();
    report += `- **${label(v.field)}:** ${displayValue(v.value)} — _${verdict}, model confidence ${pct(v.confidence)}_  \n`;
    report += `  ${v.reason || "Could not be confirmed against the source text."}\n`;
  }
  report += "\n";
}

report += `## 🔍 Not found (${notFound.length})\n\n`;
if (notFound.length === 0) {
  report += "_Every expected field was present in the document._\n";
} else {
  for (const v of notFound) {
    report += `- **${label(v.field)}:** not present in the document.\n`;
  }
}

// Lamatic's API Response mapping accepts these complex values reliably when the
// code node serializes them first. The response node deserializes them back into
// arrays/objects for API consumers.
output = {
  verified: JSON.stringify(verified),
  needs_review: JSON.stringify(needsReview),
  not_found: JSON.stringify(notFound),
  report,
  summary: JSON.stringify({
    total: verifications.length,
    verified_count: verified.length,
    needs_review_count: needsReview.length,
    not_found_count: notFound.length,
  }),
};
