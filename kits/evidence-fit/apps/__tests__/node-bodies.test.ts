import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import { SAMPLE_EXPERIMENT } from "../lib/fixtures/sample-contract.ts";
import { compareStrategies, fixedWidthChunks, clauseAwareChunks, FIXED_WIDTH_CONFIG, CLAUSE_CONFIG } from "../lib/evidence/core.ts";

const require = createRequire(import.meta.url);
const { buildNodeBody } = require("../../scripts/build-node-body.cjs") as { buildNodeBody(source: string): string };
const source = readFileSync(new URL("../../scripts/evidence-fit-evaluate_metrics.ts", import.meta.url), "utf8");
const body = buildNodeBody(source);
const trigger = { ...SAMPLE_EXPERIMENT, documentText: SAMPLE_EXPERIMENT.documentText.replace(/\r\n/g, "\n") };
const fixed = fixedWidthChunks(trigger.documentText, trigger.documentId, FIXED_WIDTH_CONFIG);
const clause = clauseAwareChunks(trigger.documentText, trigger.documentId, CLAUSE_CONFIG);
const entries = trigger.cases.map(c => ({ caseId: c.id, results: [...fixed, ...clause] }));

function run(loopOutput: unknown, code = body) {
  const bindings: Record<string, unknown> = {
    "triggerNode_1.output": JSON.stringify(trigger),
    "forLoopEndNode_6.output": loopOutput,
  };
  const script = code.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    assert.ok(Object.hasOwn(bindings, key), `Unexpected binding: ${key}`);
    return JSON.stringify(bindings[key]);
  });
  const context = { output: undefined };
  vm.runInNewContext(script, context, { timeout: 1000 });
  return JSON.parse(JSON.stringify(context.output));
}

// This is the observed Studio contract, including unrelated node output and
// reminted node ids. The prior parser counted condition + loopOutput as 2 cases.
function envelope(stringifyNested = false) {
  const encode = (value: unknown) => stringifyNested ? JSON.stringify(value) : value;
  return {
    condition: "Loop End",
    loopOutput: encode(entries.map(entry => encode({
      searchNode_42: { output: { searchResults: entry.results } },
      codeNode_99: encode({ output: encode(entry) }),
      missingOutput: { status: "success" },
    }))),
  };
}

test("built Metrics handles the live Loop End envelope as objects and JSON text", () => {
  const expected = compareStrategies({ ...trigger, rankedByStrategy: {
    "fixed-width": Object.fromEntries(trigger.cases.map(c => [c.id, fixed])),
    "clause-aware": Object.fromEntries(trigger.cases.map(c => [c.id, clause])),
  } });
  assert.equal(expected.ok, true);
  if (!expected.ok) return;
  for (const input of [envelope(), JSON.stringify(envelope()), JSON.stringify(envelope(true))]) {
    const result = run(input);
    assert.equal(result._entriesReceived, 5);
    assert.equal(result.verdict, "SHIP");
    assert.deepEqual(result.baseline, expected.comparison.baseline);
    assert.deepEqual(result.candidate, expected.comparison.candidate);
  }
});

test("live envelope parsing preserves real retrieval misses", () => {
  const input = envelope();
  input.loopOutput = entries.map(entry => ({ codeNode_5: { output: {
    ...entry, results: entry.results.filter(hit => hit.chunkId !== "fixed-3"),
  } } }));
  const result = run(input);
  assert.equal(result._entriesReceived, 5);
  assert.equal(result.baseline.spanCoverageAtK.numerator, 736);
  assert.equal(result.baseline.completeEvidenceRecallAtK.numerator, 4);
  assert.equal(result.candidate.spanCoverageAtK.numerator, 814);
  assert.equal(result.candidate.completeEvidenceRecallAtK.numerator, 5);
  assert.equal(result.verdict, "SHIP");
});

test("built Metrics retains accumulator compatibility and handles an empty loop", () => {
  const expected = run(envelope());
  for (const input of [entries, { results: entries }, { accumulated: { results: JSON.stringify(entries) } }]) {
    assert.deepEqual(run(input), expected);
  }
  const empty = run({ condition: "Loop End", loopOutput: [] });
  assert.equal(empty._entriesReceived, 0);
  assert.equal(empty.candidate.spanCoverageAtK.numerator, 0);
});

// Maintained source -> the artifact the exported flow actually resolves via @scripts/.
const NODE_ARTIFACTS = [
  ["evidence-fit-evaluate_metrics.ts", "evidence-fit-evaluate_code-node-7_code.ts"],
  ["evidence-fit-evaluate_combine-search-results.ts", "evidence-fit-evaluate_code-node-5_code.ts"],
  ["evidence-fit-index_prepare-chunks.ts", "evidence-fit-index_code-node-2_code.ts"],
] as const;

const readScript = (file: string) =>
  readFileSync(new URL(`../../scripts/${file}`, import.meta.url), "utf8");

test("all built node bodies fit the platform budget and contain no unresolved build placeholders", () => {
  for (const [file] of NODE_ARTIFACTS) {
    const built = buildNodeBody(readScript(file));
    assert.ok(Buffer.byteLength(built) <= 10000, `${file} exceeds the code-size budget`);
    assert.ok(!built.includes("__LAMATIC_TEMPLATE_"));
  }
});

// The flows resolve @scripts/<node>_code.ts, not the readable sources beside them. When
// those two drift, review happens against code the platform never runs. This caught a
// shipped Combine artifact that read currentCase.id without parsing it first, which
// emptied caseId and silently zeroed every retrieval metric.
test("each exported node artifact is exactly what its maintained source builds to", () => {
  for (const [source, artifact] of NODE_ARTIFACTS) {
    assert.equal(
      readScript(artifact).trim(),
      buildNodeBody(readScript(source)).trim(),
      `${artifact} has drifted from ${source} — rebuild it with scripts/build-node-body.cjs`
    );
  }
});

// A raw newline in a built body only survives while nothing normalises line endings.
// Git checkout on Windows and a paste into Studio's editor both do. The minifier turns
// the source's "\n" into a backtick literal holding a real newline, and once that
// arrives as \r\n, `CLAUSE_TERMINATORS.has(char)` can never match it — newline stops
// being a clause terminator and clause-aware chunking quietly changes shape.
test("no built node body carries a raw newline that CRLF normalisation could corrupt", () => {
  for (const [source, artifact] of NODE_ARTIFACTS) {
    for (const [label, code] of [
      [source, buildNodeBody(readScript(source))],
      [artifact, readScript(artifact).replace(/\r?\n$/, "")],
    ] as const) {
      assert.equal(
        /[\r\n]/.test(code),
        false,
        `${label} contains a raw line break; it must be escaped as \\n to survive checkout`
      );
    }
  }
});

test("compact node issues keep the engine code and evidence context", () => {
  const invalidSource = source.replace("let trigger = {{triggerNode_1.output}};", `let trigger = ${JSON.stringify({ ...trigger, cases: [{ id: "bad", question: "?", evidence: [{ quote: "absent quote" }] }] })};`);
  const result = run(envelope(), buildNodeBody(invalidSource));
  assert.equal(result.verdict, "BLOCK");
  assert.deepEqual(result.issues, [{ code: "quote_not_found", message: "quote_not_found", caseId: "bad", quote: "absent quote" }]);
});
