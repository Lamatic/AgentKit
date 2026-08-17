import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExperimentInput, LIMITS } from "../lib/validation.ts";
import { CUAD_SAMPLE } from "../lib/fixtures/cuad-sample.ts";

test("accepts the bundled CUAD sample", () => {
  const r = validateExperimentInput(CUAD_SAMPLE);
  assert.equal(r.ok, true, JSON.stringify(r));
});

test("rejects a document over the size limit", () => {
  const r = validateExperimentInput({
    ...CUAD_SAMPLE,
    documentText: "x".repeat(LIMITS.maxDocumentChars + 1),
  });
  assert.equal(r.ok, false);
});

test("rejects an empty document", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, documentText: "" }).ok, false);
});

test("rejects too many cases", () => {
  const cases = Array.from({ length: LIMITS.maxCases + 1 }, (_, i) => ({
    id: `c${i}`,
    question: "q",
    evidence: [{ quote: "x" }],
  }));
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, cases }).ok, false);
});

test("rejects zero cases", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, cases: [] }).ok, false);
});

test("rejects too many evidence quotes in one case", () => {
  const evidence = Array.from({ length: LIMITS.maxQuotesPerCase + 1 }, () => ({ quote: "x" }));
  const r = validateExperimentInput({
    ...CUAD_SAMPLE,
    cases: [{ id: "c", question: "q", evidence }],
  });
  assert.equal(r.ok, false);
});

test("rejects an over-long quote", () => {
  const r = validateExperimentInput({
    ...CUAD_SAMPLE,
    cases: [{ id: "c", question: "q", evidence: [{ quote: "x".repeat(LIMITS.maxQuoteChars + 1) }] }],
  });
  assert.equal(r.ok, false);
});

test("rejects an over-long question", () => {
  const r = validateExperimentInput({
    ...CUAD_SAMPLE,
    cases: [
      { id: "c", question: "q".repeat(LIMITS.maxQuestionChars + 1), evidence: [{ quote: "x" }] },
    ],
  });
  assert.equal(r.ok, false);
});

test("rejects a non-positive topK", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, topK: 0 }).ok, false);
});

test("rejects a topK above the limit", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, topK: LIMITS.maxTopK + 1 }).ok, false);
});

test("rejects a non-integer topK", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, topK: 2.5 }).ok, false);
});

test("accepts an omitted topK", () => {
  const { topK, ...rest } = CUAD_SAMPLE;
  assert.equal(validateExperimentInput(rest).ok, true);
});

test("rejects a missing experimentId", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, experimentId: "" }).ok, false);
});

test("rejects a missing documentId", () => {
  assert.equal(validateExperimentInput({ ...CUAD_SAMPLE, documentId: "" }).ok, false);
});

test("reports every problem at once rather than only the first", () => {
  const r = validateExperimentInput({
    experimentId: "",
    documentId: "",
    documentText: "",
    cases: [],
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.length >= 4, `expected several errors, got ${r.errors.length}`);
});

test("error messages name the offending case", () => {
  const r = validateExperimentInput({
    ...CUAD_SAMPLE,
    cases: [{ id: "bad-case", question: "", evidence: [{ quote: "x" }] }],
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.includes("bad-case")));
});
