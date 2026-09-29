import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateStrategy,
  compareStrategies,
  alignChunks,
  type Chunk,
} from "../lib/evidence/core.ts";

// Regression coverage for five verified correctness defects:
//   1. A case id missing from a supplied rankedByCaseId map must never fall
//      back to the local gold-overlap oracle (that oracle would score a case
//      that retrieved nothing as perfectly retrieved).
//   2. Top-k must be applied AFTER document filtering, consistently, so a
//      foreign-document chunk can never consume a top-k slot.
//   3. The overall verdict must be the verdict OF THE RECOMMENDED strategy,
//      and `recommended` must never name a BLOCK strategy while a non-BLOCK
//      alternative exists.
//   4. alignChunks must report alignment_error, never guess, when a chunk's
//      text is not unique in the remaining document.

const DOC = "Section 1. Scope. Termination requires ninety days notice. Section 2. Fees are net 30.";
const QUOTE = "ninety days notice";
const CASES = [{ id: "t1", question: "Notice period?", evidence: [{ quote: QUOTE }] }];

// ---- Defect 1 -----------------------------------------------------------

test("a case missing from a supplied rankedByCaseId map is treated as retrieving nothing, never SHIP", () => {
  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 5,
    // "t1" is deliberately absent — the deployed search path found nothing.
    rankedByCaseId: {},
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.cases[0].complete, false);
  assert.equal(r.result.cases[0].firstCompleteEvidenceRank, null);
  assert.notEqual(r.result.verdict, "SHIP");
});

test("an explicit empty ranking and a missing case id produce the same result", () => {
  const base = {
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware" as const,
    chunkConfig: { maxSize: 200 },
    topK: 5,
  };
  const missing = evaluateStrategy({ ...base, rankedByCaseId: {} });
  const empty = evaluateStrategy({ ...base, rankedByCaseId: { t1: [] } });
  assert.equal(missing.ok, true);
  assert.equal(empty.ok, true);
  if (!missing.ok || !empty.ok) return;
  assert.deepEqual(missing.result, empty.result);
});

// ---- Defect 4 -------------------------------------------------------------

test("a chunk text that repeats later in the document returns alignment_error", () => {
  const doc = "alpha beta alpha gamma";
  const r = alignChunks(doc, ["alpha"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "alignment_error");
});

// ---- Defect 2 -------------------------------------------------------------

test("a foreign-document chunk ranked first does not consume a top-k slot", () => {
  const start = DOC.indexOf(QUOTE);
  const end = start + QUOTE.length;
  const realChunk: Chunk = {
    chunkId: "real",
    documentId: "doc1",
    strategy: "clause-aware",
    start,
    end,
    text: QUOTE,
  };
  const foreignChunk: Chunk = {
    chunkId: "foreign",
    documentId: "OTHER",
    strategy: "clause-aware",
    start,
    end,
    text: QUOTE,
  };

  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 1,
    // The foreign chunk ranks first; with topK 1 the buggy code would slice
    // it off before document filtering, discarding the real chunk entirely.
    rankedByCaseId: { t1: [foreignChunk, realChunk] },
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.result.cases[0].complete, true);
});

test("complete and spanCoverageAtK agree when foreign-document chunks are interleaved", () => {
  const start = DOC.indexOf(QUOTE);
  const mid = start + Math.floor(QUOTE.length / 2);
  const end = start + QUOTE.length;

  const real1: Chunk = {
    chunkId: "real1",
    documentId: "doc1",
    strategy: "clause-aware",
    start,
    end: mid,
    text: DOC.slice(start, mid),
  };
  const real2: Chunk = {
    chunkId: "real2",
    documentId: "doc1",
    strategy: "clause-aware",
    start: mid,
    end,
    text: DOC.slice(mid, end),
  };
  const foreign1: Chunk = {
    chunkId: "foreign1",
    documentId: "OTHER",
    strategy: "clause-aware",
    start,
    end,
    text: DOC.slice(start, end),
  };
  const foreign2: Chunk = {
    chunkId: "foreign2",
    documentId: "OTHER",
    strategy: "clause-aware",
    start,
    end,
    text: DOC.slice(start, end),
  };

  const r = evaluateStrategy({
    documentId: "doc1",
    documentText: DOC,
    cases: CASES,
    strategy: "clause-aware",
    chunkConfig: { maxSize: 200 },
    topK: 2,
    // Two foreign-document chunks interleaved with the two real half-chunks.
    // With topK 2, only the document-filtered real chunks may occupy a slot.
    rankedByCaseId: { t1: [foreign1, real1, foreign2, real2] },
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const cr = r.result.cases[0];
  assert.equal(cr.complete, cr.spanCoverageAtK.numerator === cr.spanCoverageAtK.denominator);
  assert.equal(cr.complete, true);
});

// ---- Defect 3 -------------------------------------------------------------

test("a candidate whose own verdict is BLOCK is never reported as the overall SHIP verdict", () => {
  // The whole document is a single unbroken clause (no terminators). The
  // 16-char span sits at [495,511). Fixed-width window [450,950) (stride
  // 450, size 500) wholly contains it, so the baseline ships. But the
  // clause-aware candidate hard-splits this over-long clause exactly at
  // 500 — which falls inside [495,511) — so no single clause-aware chunk
  // contains the span, and the candidate is BLOCK.
  const PRE = "x".repeat(495);
  const MARKER = "URGENTMARKERWORD"; // 16 chars, no clause terminators
  const POST = "x".repeat(600);
  const doc = PRE + MARKER + POST;

  const r = compareStrategies({
    documentId: "doc1",
    documentText: doc,
    cases: [{ id: "c1", question: "q?", evidence: [{ quote: MARKER }] }],
    topK: 10,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;

  const { baseline, candidate, recommended, verdict } = r.comparison;
  // Sanity check the fixture actually reproduces the reported bug scenario.
  assert.equal(baseline.verdict, "SHIP");
  assert.equal(candidate.verdict, "BLOCK");

  // The BLOCK candidate must never be what "SHIP" describes.
  assert.ok(!(recommended === "clause-aware" && verdict === "SHIP"));
  assert.equal(recommended, "fixed-width");
  assert.equal(verdict, baseline.verdict);
});

test("recommended never names a BLOCK strategy when a non-BLOCK alternative exists", () => {
  // A 100-char span at [420,520). Fixed-width windows are [0,500) and
  // [450,950) (stride 450): the span starts before 450 so window1 doesn't
  // reach it, and it ends past 500 so window0 doesn't either — severed.
  // Clause-aware packs the whole enclosing (short) clause into one chunk
  // that easily contains the span intact.
  const clause1 = "x".repeat(418) + ". "; // clause1 = [0, 420)
  const marker = "y".repeat(100); // [420, 520)
  const clause2Tail = ". "; // terminator right after the marker
  const clause3 = "x".repeat(300) + "."; // filler
  const doc = clause1 + marker + clause2Tail + clause3;

  const r = compareStrategies({
    documentId: "doc1",
    documentText: doc,
    cases: [{ id: "c1", question: "q?", evidence: [{ quote: marker }] }],
    topK: 10,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;

  const { baseline, candidate, recommended, verdict } = r.comparison;
  assert.equal(baseline.verdict, "BLOCK");
  assert.equal(candidate.verdict, "SHIP");

  assert.notEqual(recommended, "fixed-width");
  assert.equal(recommended, "clause-aware");
  assert.equal(verdict, candidate.verdict);
});

test("when both strategies BLOCK, recommended is neither and verdict is BLOCK", () => {
  // A 600-character span is longer than either strategy's max chunk size
  // (500), so no chunk from either strategy can ever contain it — severed
  // both ways, regardless of position.
  const marker = "z".repeat(600);
  const doc = "Intro. " + marker + " End.";

  const r = compareStrategies({
    documentId: "doc1",
    documentText: doc,
    cases: [{ id: "c1", question: "q?", evidence: [{ quote: marker }] }],
    topK: 10,
  });
  assert.equal(r.ok, true);
  if (!r.ok) return;

  const { baseline, candidate, recommended, verdict } = r.comparison;
  assert.equal(baseline.verdict, "BLOCK");
  assert.equal(candidate.verdict, "BLOCK");
  assert.equal(recommended, "neither");
  assert.equal(verdict, "BLOCK");
});
