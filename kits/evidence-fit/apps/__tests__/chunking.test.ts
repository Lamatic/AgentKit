import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fixedWidthChunks,
  clauseAwareChunks,
  FIXED_WIDTH_CONFIG,
  CLAUSE_CONFIG,
} from "../lib/evidence/core.ts";

const DOC = "Alpha clause one. Beta clause two; gamma clause three. Delta clause four.";

// ---- fixed-width -------------------------------------------------------

test("fixed-width chunk offsets round-trip exactly", () => {
  for (const ch of fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 })) {
    assert.equal(DOC.slice(ch.start, ch.end), ch.text);
  }
});

test("fixed-width chunks cover the whole document", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 });
  assert.equal(chunks[0].start, 0);
  assert.equal(chunks[chunks.length - 1].end, DOC.length);
});

test("fixed-width chunks advance by stride = size - overlap", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 });
  assert.equal(chunks[1].start - chunks[0].start, 15);
});

test("fixed-width rejects overlap equal to size", () => {
  assert.throws(() => fixedWidthChunks(DOC, "doc1", { size: 10, overlap: 10 }), /overlap/i);
});

test("fixed-width rejects overlap greater than size", () => {
  assert.throws(() => fixedWidthChunks(DOC, "doc1", { size: 10, overlap: 11 }), /overlap/i);
});

test("fixed-width supports zero overlap", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 0 });
  assert.equal(chunks[1].start, 20);
});

test("fixed-width emits no chunk fully contained in its predecessor", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 });
  for (let i = 1; i < chunks.length; i++) {
    assert.ok(chunks[i].end > chunks[i - 1].end, "each chunk must extend past the previous");
  }
});

test("fixed-width tags strategy and documentId", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 });
  assert.equal(chunks[0].strategy, "fixed-width");
  assert.equal(chunks[0].documentId, "doc1");
});

test("fixed-width chunk ids are unique", () => {
  const chunks = fixedWidthChunks(DOC, "doc1", { size: 20, overlap: 5 });
  assert.equal(new Set(chunks.map((c) => c.chunkId)).size, chunks.length);
});

test("fixed-width handles a document shorter than one chunk", () => {
  const chunks = fixedWidthChunks("short", "doc1", { size: 500, overlap: 50 });
  assert.equal(chunks.length, 1);
  assert.deepEqual([chunks[0].start, chunks[0].end], [0, 5]);
});

// ---- clause-aware ------------------------------------------------------

test("clause-aware chunk offsets round-trip exactly", () => {
  for (const ch of clauseAwareChunks(DOC, "doc1", { maxSize: 40 })) {
    assert.equal(DOC.slice(ch.start, ch.end), ch.text);
  }
});

test("clause-aware chunks are non-overlapping and ordered", () => {
  const chunks = clauseAwareChunks(DOC, "doc1", { maxSize: 40 });
  for (let i = 1; i < chunks.length; i++) {
    assert.ok(chunks[i].start >= chunks[i - 1].end);
  }
});

test("clause-aware partitions the document with no gaps", () => {
  const chunks = clauseAwareChunks(DOC, "doc1", { maxSize: 40 });
  assert.equal(chunks.map((c) => c.text).join(""), DOC);
});

test("clause-aware keeps a whole clause intact when it fits", () => {
  const chunks = clauseAwareChunks(DOC, "doc1", { maxSize: 40 });
  assert.ok(chunks.some((c) => c.text.includes("Beta clause two")));
});

test("clause-aware splits a single clause that exceeds maxSize", () => {
  const long = "x".repeat(100) + ".";
  const chunks = clauseAwareChunks(long, "doc1", { maxSize: 40 });
  assert.ok(chunks.length > 1);
  for (const ch of chunks) assert.ok(ch.end - ch.start <= 40);
});

test("clause-aware tags strategy and documentId", () => {
  const chunks = clauseAwareChunks(DOC, "doc1", { maxSize: 40 });
  assert.equal(chunks[0].strategy, "clause-aware");
  assert.equal(chunks[0].documentId, "doc1");
});

test("clause-aware chunk ids are unique", () => {
  const chunks = clauseAwareChunks(DOC, "doc1", { maxSize: 40 });
  assert.equal(new Set(chunks.map((c) => c.chunkId)).size, chunks.length);
});

test("clause-aware treats newlines as clause boundaries", () => {
  const doc = "First line\nSecond line\nThird line";
  const chunks = clauseAwareChunks(doc, "doc1", { maxSize: 12 });
  assert.equal(chunks.map((c) => c.text).join(""), doc);
  assert.ok(chunks.length >= 3);
});

test("clause-aware handles a document with no terminator at all", () => {
  const doc = "no terminators here at all";
  const chunks = clauseAwareChunks(doc, "doc1", { maxSize: 100 });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, doc);
});

// ---- shared ------------------------------------------------------------

test("both strategies handle an empty document", () => {
  assert.deepEqual(fixedWidthChunks("", "doc1", { size: 20, overlap: 5 }), []);
  assert.deepEqual(clauseAwareChunks("", "doc1", { maxSize: 40 }), []);
});

test("exported default configs are documented, valid constants", () => {
  assert.equal(typeof FIXED_WIDTH_CONFIG.size, "number");
  assert.equal(typeof FIXED_WIDTH_CONFIG.overlap, "number");
  assert.ok(FIXED_WIDTH_CONFIG.overlap < FIXED_WIDTH_CONFIG.size);
  assert.equal(typeof CLAUSE_CONFIG.maxSize, "number");
  assert.ok(CLAUSE_CONFIG.maxSize > 0);
});
