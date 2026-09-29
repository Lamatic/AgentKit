import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveGoldSpans, findAllOccurrences } from "../lib/evidence/core.ts";

const DOC = "The term is five years. Payment is net 30. The term is five years again.";

test("findAllOccurrences reports overlapping matches", () => {
  assert.deepEqual(findAllOccurrences("aaa", "aa"), [0, 1]);
});

test("findAllOccurrences returns an empty list for an empty needle", () => {
  assert.deepEqual(findAllOccurrences("abc", ""), []);
});

test("resolves a unique quote by exact search", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "Payment terms?", evidence: [{ quote: "net 30" }] },
  ]);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  const span = r.cases[0].spans[0];
  assert.equal(DOC.slice(span.start, span.end), "net 30");
});

test("defaults required to true when omitted", () => {
  const r = resolveGoldSpans(DOC, [{ id: "c1", question: "q", evidence: [{ quote: "net 30" }] }]);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.cases[0].required, true);
});

test("honours required: false", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30" }], required: false },
  ]);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.cases[0].required, false);
});

test("rejects a quote that appears more than once without offsets", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "The term is five years" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "ambiguous_quote");
});

test("accepts a duplicated quote when explicit offsets disambiguate it", () => {
  const quote = "The term is five years";
  const second = DOC.lastIndexOf(quote);
  assert.notEqual(second, 0, "fixture must contain the quote twice");
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote, start: second, end: second + quote.length }] },
  ]);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.cases[0].spans[0].start, second);
});

test("counts overlapping occurrences as ambiguous", () => {
  const r = resolveGoldSpans("aaa", [{ id: "c1", question: "q", evidence: [{ quote: "aa" }] }]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "ambiguous_quote");
});

test("rejects a quote absent from the document", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "arbitration" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "quote_not_found");
});

test("rejects offsets whose slice does not equal the quote", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30", start: 0, end: 6 }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "offset_mismatch");
});

test("rejects out-of-bounds offsets", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30", start: 900, end: 906 }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "offset_out_of_bounds");
});

test("rejects an inverted offset range", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30", start: 20, end: 10 }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "offset_out_of_bounds");
});

test("rejects non-integer offsets", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30", start: 1.5, end: 7.5 }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "offset_out_of_bounds");
});

test("rejects an empty quote", () => {
  const r = resolveGoldSpans(DOC, [{ id: "c1", question: "q", evidence: [{ quote: "" }] }]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "empty_quote");
});

test("rejects a case with no evidence", () => {
  const r = resolveGoldSpans(DOC, [{ id: "c1", question: "q", evidence: [] }]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "no_evidence");
});

test("rejects duplicate case ids", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30" }] },
    { id: "c1", question: "q2", evidence: [{ quote: "net 30" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "duplicate_case_id");
});

test("reports every issue, not just the first", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "nope" }] },
    { id: "c2", question: "q", evidence: [{ quote: "also nope" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues.length, 2);
});

test("supports multiple gold spans in one case", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30" }, { quote: "Payment is" }] },
  ]);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.cases[0].spans.length, 2);
});

test("a partially invalid case never appears in the resolved output", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "c1", question: "q", evidence: [{ quote: "net 30" }, { quote: "missing" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "quote_not_found");
});

test("issues carry the case id so the operator can act on them", () => {
  const r = resolveGoldSpans(DOC, [
    { id: "case-42", question: "q", evidence: [{ quote: "missing" }] },
  ]);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].caseId, "case-42");
  assert.ok(r.issues[0].message.length > 0);
});

test("resolving zero cases succeeds with zero resolved cases", () => {
  const r = resolveGoldSpans(DOC, []);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.cases, []);
});
