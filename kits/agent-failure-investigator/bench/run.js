const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { performance } = require("perf_hooks");
const { forgeDataset } = require("./forge");

const ROOT = path.join(__dirname, "..");
const sandbox = { console, module: { exports: {} } };
vm.createContext(sandbox);
[
  "rules/core.js", "rules/tool_failure.js", "rules/hallucination.js",
  "rules/rag.js", "rules/prompt.js", "rules/wrong_tool.js", "js/engine.js"
].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f }));

const investigate = vm.runInContext("runInvestigation", sandbox);
const N = Number(process.argv[2]) || 100;
const dataset = forgeDataset(N);

let correct = 0, falsePositive = 0, falseNegative = 0, misclassified = 0;
const perCategory = {};
const timings = [];

dataset.forEach(({ label, trace }) => {
  const t0 = performance.now();
  const verdict = investigate(trace).primary;
  timings.push(performance.now() - t0);

  if (label) {
    perCategory[label] = perCategory[label] || { total: 0, hit: 0 };
    perCategory[label].total++;
    if (verdict === label) { correct++; perCategory[label].hit++; }
    else if (verdict === null) falseNegative++;
    else misclassified++;
  } else {
    verdict === null ? correct++ : falsePositive++;
  }
});

const pct = n => ((n / dataset.length) * 100).toFixed(1) + "%";
const avgMs = (timings.reduce((a, b) => a + b, 0) / timings.length).
  toFixed(2);
const sorted = [...timings].sort((a, b) => a - b);
const p95 = sorted[Math.floor(sorted.length * 0.95)].toFixed(2);

const rows = [
  ["Traces", dataset.length],
  ["Accuracy", pct(correct)],
  ["False positives", pct(falsePositive)],
  ["False negatives", pct(falseNegative)],
  ["Misclassified", pct(misclassified)],
  ["Avg time / trace", avgMs + " ms"],
  ["p95 time / trace", p95 + " ms"]
];

console.log("\n  BENCHMARK — deterministic rule engine\n  " + "─".repeat(42));
rows.forEach(([k, v]) => console.log(`  ${String(k).padEnd(20)} ${v}`));
console.log("  " + "─".repeat(42) + "\n  Per-category recall:");
Object.entries(perCategory).forEach(([k, s]) =>
  console.log(`  ${k.padEnd(20)} ${s.hit}/${s.total}  (${((s.hit / s.total) * 100).toFixed(0)}%)`));
console.log("");

fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify({
  generated: new Date().toISOString(), traces: dataset.length,
  accuracy: pct(correct), false_positives: pct(falsePositive),
  false_negatives: pct(falseNegative), misclassified: pct(misclassified),
  avg_ms: Number(avgMs), p95_ms: Number(p95),
  per_category: perCategory
}, null, 2));
console.log("  results written to bench/results.json\n");
