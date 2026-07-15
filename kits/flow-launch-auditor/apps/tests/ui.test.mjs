import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pageSource = fs.readFileSync(new URL("../app/page.jsx", import.meta.url), "utf8");
const errorSource = fs.readFileSync(new URL("../app/error.jsx", import.meta.url), "utf8");
const globalErrorSource = fs.readFileSync(new URL("../app/global-error.jsx", import.meta.url), "utf8");
const flowSource = fs.readFileSync(
  new URL("../../flows/flow-launch-auditor.ts", import.meta.url),
  "utf8"
);

test("page UI keeps primary launch-audit controls and secret guidance", () => {
  assert.match(pageSource, /Flow Launch Auditor/);
  assert.match(pageSource, /Audit Launch Readiness/);
  assert.match(pageSource, /Sample Input/);
  assert.match(pageSource, /do not paste secret values/i);
  assert.match(pageSource, /do not paste real keys, tokens, passwords, or private customer data/i);
});

test("error boundaries expose retry affordances", () => {
  assert.match(errorSource, /Audit view failed/);
  assert.match(errorSource, /Try Again/);
  assert.match(globalErrorSource, /Audit shell failed/);
  assert.match(globalErrorSource, /Try Again/);
});

test("exported Flow schema enforces environment-token syntax", () => {
  assert.match(flowSource, /\\"pattern\\": \\"\^\[A-Z\]\[A-Z0-9_\]\*\$\\"/);
});
