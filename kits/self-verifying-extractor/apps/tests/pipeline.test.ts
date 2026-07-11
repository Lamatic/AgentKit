import { describe, expect, it } from "vitest";
import {
  assertFlowSuccess,
  assertReportMatches,
  assertVerificationCoverage,
  derivePage,
  expandAndValidate,
  routeVerifications,
  simulateExtractionError,
  validateExtraction,
  validateVerifications,
  type Extraction,
} from "../lib/pipeline";

const document = `INVOICE  #A-2231
From:      Brightline Studios
Total Due:                        $1,240.00
Due Date:  03/18/2026
Terms:     Net 30. A late fee of 1.5% per month applies.`;

const extraction: Extraction = {
  document_type: "INVOICE",
  vendor_or_sender: "Brightline Studios",
  total_amount: "$1,240.00",
  due_date: "03/18/2026",
  account_or_invoice_number: "#A-2231",
  key_terms: ["Net 30", "A late fee of 1.5% per month applies"],
};

function verdicts() {
  return Object.entries(extraction).map(([field, value]) => ({
    field,
    value,
    verdict: "supported",
    confidence: 0.95,
    source_quote:
      field === "document_type" || field === "account_or_invoice_number"
        ? "INVOICE  #A-2231"
        : field === "vendor_or_sender"
          ? "From:      Brightline Studios"
          : field === "total_amount"
            ? "Total Due:                        $1,240.00"
            : field === "due_date"
              ? "Due Date:  03/18/2026"
              : "Terms:     Net 30. A late fee of 1.5% per month applies.",
    reason: "",
  }));
}

// Full happy-path processing: normalize → cover → expand+evidence → route.
function process(raw: ReturnType<typeof verdicts>) {
  const normalized = validateVerifications(raw);
  assertVerificationCoverage(extraction, normalized);
  return routeVerifications(expandAndValidate(document, normalized));
}

describe("pipeline validation", () => {
  it("validates the fixed extraction contract", () => {
    expect(validateExtraction(JSON.stringify(extraction))).toEqual(extraction);
  });

  it("fails closed when extraction JSON is malformed", () => {
    expect(() => validateExtraction("not json")).toThrow("malformed JSON");
  });

  it("fails closed when verification JSON is malformed", () => {
    expect(() => validateVerifications("not json")).toThrow("malformed JSON");
  });

  it("fails closed on a non-success Lamatic flow response", () => {
    expect(() =>
      assertFlowSuccess({ status: "error", statusCode: 502, message: "workflow not found" }, "Extract"),
    ).toThrow("Extract failed (502): workflow not found");
  });

  it("fails closed when a Lamatic flow returns no result", () => {
    expect(() => assertFlowSuccess({ status: "success", result: null }, "Verify")).toThrow(
      "Verify returned no result",
    );
  });

  it("fails closed when a Lamatic flow result is not an object", () => {
    expect(() => assertFlowSuccess({ status: "success", result: "not json" }, "Report")).toThrow(
      "malformed JSON",
    );
  });

  it("rejects an incorrect due date that is absent from the document", () => {
    const input = [
      {
        field: "due_date",
        value: "03/15/2026",
        verdict: "supported",
        confidence: 0.95,
        source_quote: "Due Date:  03/18/2026",
        reason: "",
      },
    ];
    const [checked] = expandAndValidate(document, validateVerifications(input));
    expect(checked.evidence_validated).toBe(false);
    expect(checked.verdict).toBe("ambiguous");
    expect(routeVerifications([checked]).needsReview).toHaveLength(1);
  });

  it("verifies every field when quotes and values are exact (key_terms split)", () => {
    const routed = process(verdicts());
    // 5 scalars + 2 split key_terms = 7 evidence-checked entries, all verified.
    expect(routed.verified).toHaveLength(7);
    expect(routed.needsReview).toHaveLength(0);
    expect(routed.notFound).toHaveLength(0);
  });

  it("grounds each key_terms item independently against the document", () => {
    const input = [
      {
        field: "key_terms",
        value: ["Net 30", "1.5% late fee per month"],
        verdict: "supported",
        confidence: 0.95,
        source_quote: "Terms:     Net 30. A late fee of 1.5% per month applies.",
        reason: "",
      },
    ];
    const processed = expandAndValidate(document, validateVerifications(input));
    const routed = routeVerifications(processed);
    // "Net 30" is verbatim; "1.5% late fee per month" is not in the document.
    expect(routed.verified.map((v) => v.value)).toEqual(["Net 30"]);
    expect(routed.needsReview.map((v) => v.value)).toEqual(["1.5% late fee per month"]);
  });

  it("verifies present key_terms even when the verifier marks the array ambiguous", () => {
    // Regression: the verifier once marked verbatim terms "ambiguous · 0.6"
    // (reasoning about whether they were *key* terms). Presence is decided in code.
    const input = [
      {
        field: "key_terms",
        value: ["Net 30", "A late fee of 1.5% per month applies"],
        verdict: "ambiguous",
        confidence: 0.6,
        source_quote: "",
        reason: "not explicitly listed as key terms",
      },
    ];
    const routed = routeVerifications(expandAndValidate(document, validateVerifications(input)));
    expect(routed.verified.map((v) => v.value)).toEqual([
      "Net 30",
      "A late fee of 1.5% per month applies",
    ]);
    expect(routed.needsReview).toHaveLength(0);
    expect(routed.verified.every((v) => v.evidence_validated)).toBe(true);
  });

  it("downgrades a hallucinated source quote", () => {
    const input = [
      {
        field: "due_date",
        value: "03/18/2026",
        verdict: "supported",
        confidence: 0.99,
        source_quote: "Payment is due on 03/18/2026",
        reason: "",
      },
    ];
    const [checked] = expandAndValidate(document, validateVerifications(input));
    expect(checked.verdict).toBe("ambiguous");
    expect(checked.evidence_validated).toBe(false);
    expect(checked.reason).toContain("not an exact substring");
  });

  it("downgrades normalized values that are not verbatim", () => {
    const input = [
      {
        field: "document_type",
        value: "invoice",
        verdict: "supported",
        confidence: 0.95,
        source_quote: "INVOICE  #A-2231",
        reason: "",
      },
    ];
    const [checked] = expandAndValidate(document, validateVerifications(input));
    expect(checked.verdict).toBe("ambiguous");
    expect(checked.reason).toContain("value is not present verbatim");
  });

  it("routes an absent (null) field to Not found", () => {
    const input = [
      {
        field: "vendor_or_sender",
        value: null,
        verdict: "unsupported",
        confidence: 0,
        source_quote: "",
        reason: "No vendor stated.",
      },
    ];
    const routed = routeVerifications(expandAndValidate(document, validateVerifications(input)));
    expect(routed.notFound.map((v) => v.field)).toEqual(["vendor_or_sender"]);
    expect(routed.verified).toHaveLength(0);
    expect(routed.summary.not_found_count).toBe(1);
  });

  it("low confidence never reaches Verified", () => {
    const input = [
      {
        field: "total_amount",
        value: "$1,240.00",
        verdict: "supported",
        confidence: 0.4,
        source_quote: "Total Due:                        $1,240.00",
        reason: "",
      },
    ];
    const routed = routeVerifications(expandAndValidate(document, validateVerifications(input)));
    expect(routed.verified).toHaveLength(0);
    expect(routed.needsReview).toHaveLength(1);
  });

  it("simulates a single-digit extraction error that leaves the document", () => {
    const { change, extraction: corrupted } = simulateExtractionError(document, extraction);
    expect(change).not.toBeNull();
    expect(change?.field).toBe("due_date");
    expect(change?.corrupted).not.toBe(change?.original);
    expect(document.includes(change?.corrupted ?? "")).toBe(false);
    expect(corrupted.due_date).toBe(change?.corrupted);
  });

  it("rejects a verifier that changes an extracted value", () => {
    const raw = validateVerifications(verdicts());
    raw[3] = { ...raw[3], value: "03/15/2026" };
    expect(() => assertVerificationCoverage(extraction, raw)).toThrow(
      "changed the extracted value for due_date",
    );
  });

  it("tolerates a re-ordered key_terms array (order-insensitive coverage)", () => {
    const raw = validateVerifications(verdicts());
    raw[5] = { ...raw[5], value: ["A late fee of 1.5% per month applies", "Net 30"] };
    expect(() => assertVerificationCoverage(extraction, raw)).not.toThrow();
  });

  it("rejects a verifier that omits an extracted field", () => {
    const raw = validateVerifications(verdicts().slice(0, -1));
    expect(() => assertVerificationCoverage(extraction, raw)).toThrow(
      "omitted required fields: key_terms",
    );
  });

  it("attributes verified fields to a PDF page from page markers", () => {
    const pdfDoc = `--- Page 1 ---
INVOICE  #A-2231
Total Due:                        $1,240.00

--- Page 2 ---
Due Date:  03/18/2026
Terms:     Net 30.`;
    const input = [
      {
        field: "due_date",
        value: "03/18/2026",
        verdict: "supported",
        confidence: 0.95,
        source_quote: "Due Date:  03/18/2026",
        reason: "",
      },
    ];
    const [checked] = expandAndValidate(pdfDoc, validateVerifications(input));
    expect(checked.evidence_validated).toBe(true);
    expect(checked.source_page).toBe(2);
  });

  it("returns null page for pasted text without page markers", () => {
    expect(derivePage(document, "Due Date:  03/18/2026")).toBeNull();
  });

  it("checks Lamatic report routing against deterministic routing", () => {
    const routed = process(verdicts());
    expect(() =>
      assertReportMatches(routed, {
        verified: JSON.stringify(routed.verified),
        needs_review: JSON.stringify(routed.needsReview),
        not_found: JSON.stringify(routed.notFound),
      }),
    ).not.toThrow();
  });

  it("fails closed when the Report flow disagrees with local routing", () => {
    const routed = process(verdicts());
    const [promoted, ...remainingVerified] = routed.verified;

    expect(() =>
      assertReportMatches(routed, {
        verified: JSON.stringify(remainingVerified),
        needs_review: JSON.stringify([...routed.needsReview, promoted]),
        not_found: JSON.stringify(routed.notFound),
      }),
    ).toThrow("disagreed with deterministic verified routing");
  });
});
