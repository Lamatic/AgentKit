import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeSpans,
  unionLength,
  overlaps,
  contains,
  intersectLength,
  makeRate,
} from "../lib/evidence/core.ts";

test("mergeSpans merges overlapping spans", () => {
  assert.deepEqual(mergeSpans([{ start: 0, end: 5 }, { start: 3, end: 9 }]), [{ start: 0, end: 9 }]);
});

test("mergeSpans merges exactly adjacent spans", () => {
  assert.deepEqual(mergeSpans([{ start: 0, end: 5 }, { start: 5, end: 9 }]), [{ start: 0, end: 9 }]);
});

test("mergeSpans keeps disjoint spans separate and sorted", () => {
  assert.deepEqual(mergeSpans([{ start: 10, end: 12 }, { start: 0, end: 5 }]), [
    { start: 0, end: 5 },
    { start: 10, end: 12 },
  ]);
});

test("mergeSpans swallows a span fully inside another", () => {
  assert.deepEqual(mergeSpans([{ start: 0, end: 20 }, { start: 5, end: 9 }]), [
    { start: 0, end: 20 },
  ]);
});

test("mergeSpans drops empty spans", () => {
  assert.deepEqual(mergeSpans([{ start: 4, end: 4 }, { start: 0, end: 2 }]), [{ start: 0, end: 2 }]);
});

test("mergeSpans does not mutate its input", () => {
  const input = [{ start: 0, end: 5 }, { start: 3, end: 9 }];
  mergeSpans(input);
  assert.deepEqual(input, [{ start: 0, end: 5 }, { start: 3, end: 9 }]);
});

test("mergeSpans of an empty list is an empty list", () => {
  assert.deepEqual(mergeSpans([]), []);
});

test("unionLength does not double-count overlap", () => {
  assert.equal(unionLength([{ start: 0, end: 10 }, { start: 5, end: 15 }]), 15);
});

test("unionLength of empty list is 0", () => {
  assert.equal(unionLength([]), 0);
});

test("overlaps is false for exactly adjacent spans", () => {
  assert.equal(overlaps({ start: 0, end: 5 }, { start: 5, end: 9 }), false);
});

test("overlaps is true for a one-character overlap", () => {
  assert.equal(overlaps({ start: 0, end: 6 }, { start: 5, end: 9 }), true);
});

test("overlaps is symmetric", () => {
  const a = { start: 0, end: 6 };
  const b = { start: 5, end: 9 };
  assert.equal(overlaps(a, b), overlaps(b, a));
});

test("contains is inclusive at both edges", () => {
  assert.equal(contains({ start: 0, end: 10 }, { start: 0, end: 10 }), true);
  assert.equal(contains({ start: 0, end: 10 }, { start: 0, end: 11 }), false);
  assert.equal(contains({ start: 0, end: 10 }, { start: -1, end: 10 }), false);
});

test("intersectLength returns 0 when disjoint", () => {
  assert.equal(intersectLength({ start: 0, end: 5 }, { start: 5, end: 9 }), 0);
});

test("intersectLength returns the overlap size", () => {
  assert.equal(intersectLength({ start: 0, end: 8 }, { start: 5, end: 20 }), 3);
});

test("intersectLength is symmetric", () => {
  const a = { start: 0, end: 8 };
  const b = { start: 5, end: 20 };
  assert.equal(intersectLength(a, b), intersectLength(b, a));
});

test("makeRate carries integer numerator and denominator", () => {
  const r = makeRate(3, 4);
  assert.equal(r.numerator, 3);
  assert.equal(r.denominator, 4);
  assert.equal(r.rate, 0.75);
});

test("makeRate returns rate 0 for a zero denominator rather than NaN", () => {
  const r = makeRate(0, 0);
  assert.equal(r.rate, 0);
  assert.equal(Number.isNaN(r.rate), false);
});
