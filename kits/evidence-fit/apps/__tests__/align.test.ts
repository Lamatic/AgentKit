import { test } from "node:test";
import assert from "node:assert/strict";
import { alignChunks } from "../lib/evidence/core.ts";

const DOC = "Alpha beta gamma delta epsilon zeta eta theta.";

test("aligns non-overlapping chunk texts to exact offsets", () => {
  const r = alignChunks(
    DOC,
    ["Alpha beta ", "gamma delta ", "epsilon zeta eta theta."],
    "doc1",
    "fixed-width"
  );
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.chunks.length, 3);
  for (const ch of r.chunks) assert.equal(DOC.slice(ch.start, ch.end), ch.text);
});

test("aligns overlapping chunks by allowing starts to advance by at least one", () => {
  const r = alignChunks(DOC, ["Alpha beta gamma", "beta gamma delta"], "doc1", "fixed-width");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.chunks[0].start, 0);
  assert.equal(r.chunks[1].start, DOC.indexOf("beta gamma delta"));
});

test("chunk starts are monotonically increasing", () => {
  const r = alignChunks(DOC, ["Alpha beta gamma", "beta gamma delta"], "doc1", "fixed-width");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.ok(r.chunks[1].start > r.chunks[0].start);
});

test("returns alignment_error when chunk text is absent from the document", () => {
  const r = alignChunks(DOC, ["Alpha beta ", "NOT IN DOCUMENT"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "alignment_error");
});

test("returns alignment_error rather than estimating when chunk order is violated", () => {
  const r = alignChunks(DOC, ["epsilon zeta", "Alpha beta"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "alignment_error");
});

test("alignment_error messages are actionable and name the chunk index", () => {
  const r = alignChunks(DOC, ["Alpha beta ", "NOT IN DOCUMENT"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.issues[0].message, /Chunk 1/);
  assert.ok(r.issues[0].message.length > 40);
});

test("returns alignment_error when whitespace was normalised away", () => {
  // A chunker that collapses double spaces produces text that is no longer a
  // verbatim substring, so offsets cannot be verified.
  const doc = "alpha  beta";
  const r = alignChunks(doc, ["alpha beta"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "alignment_error");
});

test("skips empty chunk texts without erroring", () => {
  const r = alignChunks(DOC, ["Alpha beta ", "", "gamma delta "], "doc1", "fixed-width");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.chunks.length, 2);
});

test("aligning an empty list yields no chunks", () => {
  const r = alignChunks(DOC, [], "doc1", "fixed-width");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.chunks, []);
});

test("aligned chunks carry the supplied strategy and documentId", () => {
  const r = alignChunks(DOC, ["Alpha beta "], "doc7", "clause-aware");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.chunks[0].strategy, "clause-aware");
  assert.equal(r.chunks[0].documentId, "doc7");
});

test("aligned chunk ids are unique", () => {
  const r = alignChunks(DOC, ["Alpha beta ", "gamma delta "], "doc1", "fixed-width");
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(new Set(r.chunks.map((c) => c.chunkId)).size, r.chunks.length);
});

test("a chunk text that is not unique in the remaining document returns alignment_error", () => {
  // "ab" occurs three times in "ab ab ab". Even though a monotonic scan could
  // resolve the two chunks to successive occurrences, the placement of each
  // individual chunk is still genuinely ambiguous, so §7.2 requires an
  // explicit alignment_error rather than a guess.
  const doc = "ab ab ab";
  const r = alignChunks(doc, ["ab", "ab"], "doc1", "fixed-width");
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.issues[0].code, "alignment_error");
});
