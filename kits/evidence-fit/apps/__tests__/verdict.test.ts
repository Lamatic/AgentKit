import { test } from "node:test";
import assert from "node:assert/strict";
import { computeVerdict, type Verdict } from "../lib/evidence/core.ts";

test("BLOCK when a required span is severed", () => {
  assert.equal(
    computeVerdict({ hasInvalidInput: false, requiredSeveredCount: 1, incompleteRequiredCount: 0 }),
    "BLOCK"
  );
});

test("BLOCK when input or alignment is invalid, even with nothing severed", () => {
  assert.equal(
    computeVerdict({ hasInvalidInput: true, requiredSeveredCount: 0, incompleteRequiredCount: 0 }),
    "BLOCK"
  );
});

test("BLOCK takes precedence over TUNE", () => {
  assert.equal(
    computeVerdict({ hasInvalidInput: false, requiredSeveredCount: 1, incompleteRequiredCount: 3 }),
    "BLOCK"
  );
});

test("TUNE when spans are intact but a required case is incomplete at k", () => {
  assert.equal(
    computeVerdict({ hasInvalidInput: false, requiredSeveredCount: 0, incompleteRequiredCount: 1 }),
    "TUNE"
  );
});

test("SHIP only when nothing is severed, invalid, or incomplete", () => {
  assert.equal(
    computeVerdict({ hasInvalidInput: false, requiredSeveredCount: 0, incompleteRequiredCount: 0 }),
    "SHIP"
  );
});

test("invalid input can never yield SHIP or TUNE", () => {
  for (const severed of [0, 1, 5]) {
    for (const incomplete of [0, 1, 5]) {
      assert.equal(
        computeVerdict({
          hasInvalidInput: true,
          requiredSeveredCount: severed,
          incompleteRequiredCount: incomplete,
        }),
        "BLOCK"
      );
    }
  }
});

test("a severed required span can never yield SHIP", () => {
  for (const incomplete of [0, 1, 5]) {
    const v = computeVerdict({
      hasInvalidInput: false,
      requiredSeveredCount: 2,
      incompleteRequiredCount: incomplete,
    });
    assert.notEqual(v, "SHIP");
  }
});

test("computeVerdict is total over the whole input space", () => {
  const allowed: Verdict[] = ["SHIP", "TUNE", "BLOCK"];
  for (const invalid of [true, false]) {
    for (const severed of [0, 1, 2]) {
      for (const incomplete of [0, 1, 2]) {
        const v = computeVerdict({
          hasInvalidInput: invalid,
          requiredSeveredCount: severed,
          incompleteRequiredCount: incomplete,
        });
        assert.ok(allowed.includes(v), `unexpected verdict ${v}`);
      }
    }
  }
});

test("computeVerdict is pure — repeated calls agree", () => {
  const args = {
    hasInvalidInput: false,
    requiredSeveredCount: 0,
    incompleteRequiredCount: 1,
  };
  assert.equal(computeVerdict(args), computeVerdict(args));
});
