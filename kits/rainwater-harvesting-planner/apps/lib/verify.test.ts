import { test } from "node:test";
import assert from "node:assert/strict";
import { checkPlan, extractLitres } from "./verify.ts";

const calc = { recommendedTankL: 7500, rechargePit: { needed: true, pits: 1, diameterM: 1.4 } };
const base = {
  summary: "Plan",
  recharge_advice: "Send overflow to one 1.4 m wide, 2 m deep pit filled with gravel and boulders.",
  cost_estimate: { low_inr: 30000, high_inr: 60000 },
};

test("extracts litre figures in common formats", () => {
  assert.deepEqual(extractLitres("Use a 7,500 L tank, not 5000 litres or 10 kL."), [7500, 5000, 10000]);
  assert.deepEqual(extractLitres("1,00,000 L in Indian grouping"), [100000]);
  assert.deepEqual(extractLitres("7500 लीटर की टंकी"), [7500]);
});

test("passes when the computed tank size is used", () => {
  const r = checkPlan({ ...base, tank_advice: "A 7,500 L tank fits; 5,000 L would meet less demand." }, calc);
  assert.equal(r.passed, true);
});

test("flags a plan that changes the tank size", () => {
  const r = checkPlan({ ...base, tank_advice: "Install a 10,000 L tank." }, calc);
  assert.equal(r.passed, false);
  assert.match(r.issues[0], /7,500 L/);
});

test("flags missing recharge guidance and inverted cost range", () => {
  const r = checkPlan(
    { ...base, tank_advice: "A 7500 L tank.", recharge_advice: "", cost_estimate: { low_inr: 90000, high_inr: 40000 } },
    calc,
  );
  assert.equal(r.issues.length, 2);
});

test("flags tank advice that omits the computed size", () => {
  assert.equal(checkPlan({ ...base, tank_advice: "" }, calc).passed, false);
  assert.equal(checkPlan({ ...base, tank_advice: "Choose a medium tank." }, calc).passed, false);
});

test("flags negative or non-finite cost amounts", () => {
  assert.equal(checkPlan({ ...base, tank_advice: "A 7,500 L tank.", cost_estimate: { low_inr: 1000, high_inr: -500 } }, calc).passed, false);
  assert.equal(checkPlan({ ...base, tank_advice: "A 7,500 L tank.", cost_estimate: { low_inr: Number.NaN, high_inr: 5000 } }, calc).passed, false);
});
