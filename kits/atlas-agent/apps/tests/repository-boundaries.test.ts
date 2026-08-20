import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("deployed app does not import the parent lamatic config", () => {
  const source = readFileSync(new URL("../lib/lamatic-client.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.\.\/\.\.\/lamatic\.config/);
});

test("browser-callable flow action cannot invoke protected context delivery", () => {
  const source = readFileSync(new URL("../actions/orchestrate.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /deliverExecutionContext/);
});

test("runtime bounds server actions without fake SDK cancellation", () => {
  const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const execution = readFileSync(new URL("../lib/execute-flow.ts", import.meta.url), "utf8");
  assert.match(layout, /export const maxDuration = 60/);
  assert.doesNotMatch(execution, /Promise\.race|AbortController|AbortSignal/);
});

test("environment examples remain explicitly trackable", () => {
  const rootIgnore = readFileSync(new URL("../../.gitignore", import.meta.url), "utf8");
  const appIgnore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
  assert.match(rootIgnore, /^\.env\*$/m);
  assert.match(rootIgnore, /^!\.env\.example$/m);
  assert.match(rootIgnore, /^!apps\/\.env\.example$/m);
  assert.match(appIgnore, /^\.env\*$/m);
  assert.match(appIgnore, /^!\.env\.example$/m);
});
