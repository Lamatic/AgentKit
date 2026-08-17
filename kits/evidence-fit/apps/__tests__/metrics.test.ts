import { test } from "node:test";
import assert from "node:assert/strict";
import {
  spanIntegrity,
  spanCoverageAtK,
  completeEvidenceRecallAtK,
  firstCompleteEvidenceRank,
  isCaseComplete,
  relevantChunks,
  type Chunk,
  type ResolvedCase,
} from "../lib/evidence/core.ts";

const chunk = (id: string, start: number, end: number, documentId = "doc1"): Chunk => ({
  chunkId: id,
  documentId,
  strategy: "fixed-width",
  start,
  end,
  text: "x".repeat(end - start),
});

const oneCase = (spans: { start: number; end: number }[], required = true): ResolvedCase => ({
  id: "c1",
  question: "q",
  required,
  spans: spans.map((s) => ({ ...s, quote: "x".repeat(s.end - s.start) })),
});

// ---- spanIntegrity -----------------------------------------------------

test("spanIntegrity counts a span wholly inside one chunk as intact", () => {
  const r = spanIntegrity([oneCase([{ start: 10, end: 20 }])], [chunk("a", 0, 50)], "doc1");
  assert.equal(r.rate.numerator, 1);
  assert.equal(r.rate.denominator, 1);
  assert.equal(r.boundarySeveredCount, 0);
});

test("spanIntegrity counts a span split across two chunks as severed", () => {
  const r = spanIntegrity(
    [oneCase([{ start: 10, end: 30 }])],
    [chunk("a", 0, 20), chunk("b", 20, 40)],
    "doc1"
  );
  assert.equal(r.boundarySeveredCount, 1);
  assert.equal(r.rate.numerator, 0);
  assert.equal(r.rate.denominator, 1);
});

test("spanIntegrity treats an overlapping chunk that contains the span as intact", () => {
  const r = spanIntegrity(
    [oneCase([{ start: 10, end: 30 }])],
    [chunk("a", 0, 20), chunk("b", 5, 35)],
    "doc1"
  );
  assert.equal(r.boundarySeveredCount, 0);
});

test("spanIntegrity treats a span exactly filling a chunk as intact", () => {
  const r = spanIntegrity([oneCase([{ start: 0, end: 20 }])], [chunk("a", 0, 20)], "doc1");
  assert.equal(r.boundarySeveredCount, 0);
});

test("spanIntegrity ignores chunks from a different document", () => {
  const r = spanIntegrity(
    [oneCase([{ start: 10, end: 20 }])],
    [chunk("a", 0, 50, "OTHER")],
    "doc1"
  );
  assert.equal(r.boundarySeveredCount, 1);
});

test("spanIntegrity reports which spans were severed", () => {
  const r = spanIntegrity(
    [oneCase([{ start: 10, end: 30 }])],
    [chunk("a", 0, 20), chunk("b", 20, 40)],
    "doc1"
  );
  assert.equal(r.severed.length, 1);
  assert.deepEqual([r.severed[0].start, r.severed[0].end], [10, 30]);
});

test("spanIntegrity counts every span across every case", () => {
  const r = spanIntegrity(
    [oneCase([{ start: 0, end: 5 }, { start: 10, end: 15 }])],
    [chunk("a", 0, 20)],
    "doc1"
  );
  assert.equal(r.rate.denominator, 2);
  assert.equal(r.rate.numerator, 2);
});

test("spanIntegrity of zero cases is a zero-denominator rate, not NaN", () => {
  const r = spanIntegrity([], [chunk("a", 0, 20)], "doc1");
  assert.equal(r.rate.denominator, 0);
  assert.equal(Number.isNaN(r.rate.rate), false);
});

// ---- relevantChunks ----------------------------------------------------

test("relevantChunks excludes exactly adjacent chunks", () => {
  const r = relevantChunks({ start: 10, end: 20 }, [chunk("a", 0, 10), chunk("b", 20, 30)], "doc1");
  assert.equal(r.length, 0);
});

test("relevantChunks includes a one-character overlap", () => {
  const r = relevantChunks({ start: 10, end: 20 }, [chunk("a", 0, 11)], "doc1");
  assert.equal(r.length, 1);
});

test("relevantChunks filters by document identity", () => {
  const r = relevantChunks({ start: 10, end: 20 }, [chunk("a", 0, 50, "OTHER")], "doc1");
  assert.equal(r.length, 0);
});

// ---- spanCoverageAtK ---------------------------------------------------

test("spanCoverageAtK unions chunks without double counting", () => {
  const c = oneCase([{ start: 0, end: 100 }]);
  const r = spanCoverageAtK(c, [chunk("a", 0, 60), chunk("b", 40, 100)], 2, "doc1");
  assert.equal(r.numerator, 100);
  assert.equal(r.denominator, 100);
});

test("spanCoverageAtK honours k by truncating the ranked list", () => {
  const c = oneCase([{ start: 0, end: 100 }]);
  const r = spanCoverageAtK(c, [chunk("a", 0, 50), chunk("b", 50, 100)], 1, "doc1");
  assert.equal(r.numerator, 50);
  assert.equal(r.denominator, 100);
});

test("spanCoverageAtK de-duplicates overlapping gold spans", () => {
  const c = oneCase([{ start: 0, end: 10 }, { start: 5, end: 15 }]);
  const r = spanCoverageAtK(c, [chunk("a", 0, 15)], 1, "doc1");
  assert.equal(r.denominator, 15);
  assert.equal(r.numerator, 15);
});

test("spanCoverageAtK counts only the gold portion of a large chunk", () => {
  const c = oneCase([{ start: 40, end: 50 }]);
  const r = spanCoverageAtK(c, [chunk("a", 0, 1000)], 1, "doc1");
  assert.equal(r.numerator, 10);
  assert.equal(r.denominator, 10);
});

test("spanCoverageAtK ignores chunks from another document", () => {
  const c = oneCase([{ start: 0, end: 10 }]);
  const r = spanCoverageAtK(c, [chunk("a", 0, 10, "OTHER")], 5, "doc1");
  assert.equal(r.numerator, 0);
});

test("spanCoverageAtK with no retrieval is zero, not NaN", () => {
  const c = oneCase([{ start: 0, end: 10 }]);
  const r = spanCoverageAtK(c, [], 5, "doc1");
  assert.equal(r.numerator, 0);
  assert.equal(r.denominator, 10);
  assert.equal(r.rate, 0);
});

test("spanCoverageAtK applies k after document filtering, not before", () => {
  // The foreign chunk must not consume a top-k slot.
  const c = oneCase([{ start: 0, end: 10 }]);
  const r = spanCoverageAtK(c, [chunk("x", 0, 10, "OTHER"), chunk("a", 0, 10)], 1, "doc1");
  assert.equal(r.numerator, 10);
});

// ---- completeEvidenceRecallAtK ----------------------------------------

test("completeEvidenceRecallAtK requires every span of a case", () => {
  const c = oneCase([{ start: 0, end: 10 }, { start: 90, end: 100 }]);
  const partial = completeEvidenceRecallAtK([{ c, ranked: [chunk("a", 0, 10)] }], 5, "doc1");
  assert.equal(partial.numerator, 0);
  assert.equal(partial.denominator, 1);

  const full = completeEvidenceRecallAtK(
    [{ c, ranked: [chunk("a", 0, 10), chunk("b", 90, 100)] }],
    5,
    "doc1"
  );
  assert.equal(full.numerator, 1);
});

test("completeEvidenceRecallAtK counts only required cases", () => {
  const optional = oneCase([{ start: 0, end: 10 }], false);
  const r = completeEvidenceRecallAtK([{ c: optional, ranked: [] }], 5, "doc1");
  assert.equal(r.denominator, 0);
  assert.equal(Number.isNaN(r.rate), false);
});

test("completeEvidenceRecallAtK accepts two chunks jointly covering one span", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  const r = completeEvidenceRecallAtK(
    [{ c, ranked: [chunk("a", 0, 12), chunk("b", 10, 20)] }],
    5,
    "doc1"
  );
  assert.equal(r.numerator, 1);
});

test("completeEvidenceRecallAtK respects k when truncating", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  const r = completeEvidenceRecallAtK(
    [{ c, ranked: [chunk("a", 0, 12), chunk("b", 10, 20)] }],
    1,
    "doc1"
  );
  assert.equal(r.numerator, 0);
});

test("isCaseComplete is false when a case has no gold characters", () => {
  const empty: ResolvedCase = { id: "c", question: "q", required: true, spans: [] };
  assert.equal(isCaseComplete(empty, [chunk("a", 0, 10)], "doc1"), false);
});

// ---- firstCompleteEvidenceRank ----------------------------------------

test("firstCompleteEvidenceRank returns the 1-based rank of completion", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  assert.equal(firstCompleteEvidenceRank(c, [chunk("a", 0, 10), chunk("b", 10, 20)], "doc1"), 2);
});

test("firstCompleteEvidenceRank returns 1 when the first chunk suffices", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  assert.equal(firstCompleteEvidenceRank(c, [chunk("a", 0, 50)], "doc1"), 1);
});

test("firstCompleteEvidenceRank returns null when never complete", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  assert.equal(firstCompleteEvidenceRank(c, [chunk("a", 0, 5)], "doc1"), null);
});

test("firstCompleteEvidenceRank returns null for an empty ranked list", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  assert.equal(firstCompleteEvidenceRank(c, [], "doc1"), null);
});

test("firstCompleteEvidenceRank ignores foreign-document chunks when ranking", () => {
  const c = oneCase([{ start: 0, end: 20 }]);
  const rank = firstCompleteEvidenceRank(
    c,
    [chunk("x", 0, 20, "OTHER"), chunk("a", 0, 20)],
    "doc1"
  );
  assert.equal(rank, 1);
});
