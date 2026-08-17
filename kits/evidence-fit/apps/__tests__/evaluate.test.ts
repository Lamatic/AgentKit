import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateStrategy, compareStrategies } from "../lib/evidence/core.ts";

// "ninety days notice" straddles the boundary at offset 40 when the document is
// cut into 20-character windows, so the baseline severs it and the clause-aware
// strategy does not. This is the product's core claim in miniature.
const DOC =
  "Section 1. Scope. Termination requires ninety days notice. Section 2. Fees are net 30.";

const CASES = [
  { id: "t1", question: "Notice period?", evidence: [{ quote: "ninety days notice" }] },
];

test("evaluateStrategy reports BLOCK when a required span is severed", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "fixed-width",
    chunkConfig: { size: 20, overlap: 0 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.verdict, "BLOCK");
  assert.ok(r.result.boundarySeveredCount >= 1);
  assert.equal(r.result.spanIntegrityRate.numerator, 0);
});

test("evaluateStrategy reports SHIP when clause chunking preserves the span", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.boundarySeveredCount, 0);
  assert.equal(r.result.verdict, "SHIP");
});

test("evaluateStrategy surfaces resolution issues instead of throwing", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: [{ id: "x", question: "q", evidence: [{ quote: "not present anywhere" }] }],
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 5,
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "quote_not_found");
});

test("every case result carries a first-complete rank or an explicit null", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const cr = r.result.cases[0];
  assert.ok(
    cr.firstCompleteEvidenceRank === null || typeof cr.firstCompleteEvidenceRank === "number"
  );
});

test("evaluateStrategy reports the severed spans on the owning case", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "fixed-width",
    chunkConfig: { size: 20, overlap: 0 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.cases[0].severedSpans.length, 1);
  assert.equal(r.result.cases[0].severedSpans[0].quote, "ninety days notice");
});

test("an optional case cannot force a BLOCK verdict", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: [{ ...CASES[0], required: false }],
    strategy: "fixed-width",
    chunkConfig: { size: 20, overlap: 0 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.verdict, "SHIP");
  // The severance is still measured and reported, just not gating.
  assert.ok(r.result.boundarySeveredCount >= 1);
});

test("evaluateStrategy accepts injected rankings from the deployed search path", () => {
  const injected = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 5,
    // Search returned nothing for this case.
    rankedByCaseId: { t1: [] },
  });
  assert.equal(injected.ok, true);
  if (!injected.ok) return;
  assert.equal(injected.result.verdict, "TUNE");
  assert.equal(injected.result.cases[0].firstCompleteEvidenceRank, null);
});

test("chunks are returned so the UI can render boundary inspection", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "fixed-width",
    chunkConfig: { size: 20, overlap: 0 },
    topK: 5,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.chunkCount, r.result.chunks.length);
  for (const ch of r.result.chunks) assert.equal(DOC.slice(ch.start, ch.end), ch.text);
});

test("compareStrategies returns both strategies and names a recommendation", () => {
  const r = compareStrategies({ documentId: "doc1", documentText: DOC, cases: CASES, topK: 5 });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.comparison.baseline.strategy, "fixed-width");
  assert.equal(r.comparison.candidate.strategy, "clause-aware");
  assert.ok(["fixed-width", "clause-aware", "neither"].includes(r.comparison.recommended));
});

test("compareStrategies propagates invalid input rather than reporting a verdict", () => {
  const r = compareStrategies({
    documentId: "doc1",
    documentText: DOC,
    cases: [{ id: "x", question: "q", evidence: [{ quote: "missing" }] }],
    topK: 5,
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "quote_not_found");
});

test("compareStrategies reports the better of the two verdicts", () => {
  const r = compareStrategies({ documentId: "doc1", documentText: DOC, cases: CASES, topK: 5 });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const order = { SHIP: 0, TUNE: 1, BLOCK: 2 } as const;
  const best = Math.min(
    order[r.comparison.baseline.verdict],
    order[r.comparison.candidate.verdict]
  );
  assert.equal(order[r.comparison.verdict], best);
});
