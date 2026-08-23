import { test } from "node:test";
import assert from "node:assert/strict";
import { validateExperimentInput, LIMITS } from "../lib/validation.ts";
import { SAMPLE_EXPERIMENT } from "../lib/fixtures/sample-contract.ts";

test("accepts the bundled sample experiment", () => {
  const r = validateExperimentInput(SAMPLE_EXPERIMENT);
  assert.equal(r.ok, true, JSON.stringify(r));
});

test("rejects a document over the size limit", () => {
  const r = validateExperimentInput({
    ...SAMPLE_EXPERIMENT,
    documentText: "x".repeat(LIMITS.maxDocumentChars + 1),
  });
  assert.equal(r.ok, false);
});

test("rejects an empty document", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, documentText: "" }).ok, false);
});

test("rejects too many cases", () => {
  const cases = Array.from({ length: LIMITS.maxCases + 1 }, (_, i) => ({
    id: `c${i}`,
    question: "q",
    evidence: [{ quote: "x" }],
  }));
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, cases }).ok, false);
});

test("rejects zero cases", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, cases: [] }).ok, false);
});

test("rejects too many evidence quotes in one case", () => {
  const evidence = Array.from({ length: LIMITS.maxQuotesPerCase + 1 }, () => ({ quote: "x" }));
  const r = validateExperimentInput({
    ...SAMPLE_EXPERIMENT,
    cases: [{ id: "c", question: "q", evidence }],
  });
  assert.equal(r.ok, false);
});

test("rejects an over-long quote", () => {
  const r = validateExperimentInput({
    ...SAMPLE_EXPERIMENT,
    cases: [{ id: "c", question: "q", evidence: [{ quote: "x".repeat(LIMITS.maxQuoteChars + 1) }] }],
  });
  assert.equal(r.ok, false);
});

test("rejects an over-long question", () => {
  const r = validateExperimentInput({
    ...SAMPLE_EXPERIMENT,
    cases: [
      { id: "c", question: "q".repeat(LIMITS.maxQuestionChars + 1), evidence: [{ quote: "x" }] },
    ],
  });
  assert.equal(r.ok, false);
});

test("rejects a non-positive topK", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, topK: 0 }).ok, false);
});

test("rejects a topK above the limit", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, topK: LIMITS.maxTopK + 1 }).ok, false);
});

test("rejects a non-integer topK", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, topK: 2.5 }).ok, false);
});

test("accepts an omitted topK", () => {
  const { topK: _topK, ...rest } = SAMPLE_EXPERIMENT;
  assert.equal(validateExperimentInput(rest).ok, true);
});

test("rejects a missing experimentId", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, experimentId: "" }).ok, false);
});

test("rejects a missing documentId", () => {
  assert.equal(validateExperimentInput({ ...SAMPLE_EXPERIMENT, documentId: "" }).ok, false);
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
    ...SAMPLE_EXPERIMENT,
    cases: [{ id: "bad-case", question: "", evidence: [{ quote: "x" }] }],
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.includes("bad-case")));
});
