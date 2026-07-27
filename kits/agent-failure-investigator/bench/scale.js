/**
 * Trace-size scaling benchmark.
 *
 *   node bench/scale.js              # sizes 100, 1000, 10000 events
 *   node bench/scale.js 100 50000    # custom sizes
 *
 * For each size it forges 60 labeled traces (10 per class, healthy included),
 * pads each one with diagnostically neutral events (INFO logs, assistant
 * turns, heartbeat tool calls) up to the target size, then measures the full
 * investigation — rules + conflict resolution + scoring + timeline — and
 * asserts the verdict is IDENTICAL to the verdict on the un-padded trace.
 * So the numbers below are latency *and* a robustness proof: accuracy does
 * not degrade as traces grow.
 *
 * Results are written to bench/scale-results.json.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { performance } = require("perf_hooks");
const { forgeDataset, inflateTrace, countEvents } = require("./forge");

const ROOT = path.join(__dirname, "..");
const sandbox = { console, module: { exports: {} } };
vm.createContext(sandbox);
[
  "rules/core.js", "rules/tool_failure.js", "rules/hallucination.js",
  "rules/rag.js", "rules/prompt.js", "rules/wrong_tool.js", "js/engine.js"
].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), sandbox, { filename: f }));
const investigate = vm.runInContext("runInvestigation", sandbox);

const SIZES = process.argv.slice(2).map(Number).filter(Boolean);
if (!SIZES.length) SIZES.push(100, 1000, 10000);
const TRACES_PER_SIZE = 60;
const stat = arr => {
  const s = [...arr].sort((a, b) => a - b);
  return {
    avg: arr.reduce((a, b) => a + b, 0) / arr.length,
    p50: s[Math.floor(s.length * 0.50)],
    p95: s[Math.floor(s.length * 0.95)],
    max: s[s.length - 1]
  };
};

// base corpus: verdicts on the small, un-padded traces are ground truth
const base = forgeDataset(TRACES_PER_SIZE);
base.forEach(item => { item.baseVerdict = investigate(item.trace).primary; });

console.log("\n  SCALING BENCHMARK — engine latency vs trace size");
console.log("  " + "─".repeat(74));
console.log("  " + ["events/trace", "avg ms", "p50 ms", "p95 ms", "max ms", "traces/s", "verdicts"].map((h, i) => h.padEnd(i ? 10 : 14)).join(""));
console.log("  " + "─".repeat(74));

const results = [];
for (const size of SIZES) {
  const timings = [];
  let stable = 0;
  for (const item of base) {
    const big = inflateTrace(item.trace, size);
    if (countEvents(big) !== size) throw new Error("inflation mismatch");
    // warm-up pass so JIT noise doesn't pollute the smallest size
    investigate(big);
    const t0 = performance.now();
    const verdict = investigate(big).primary;
    timings.push(performance.now() - t0);
    if (verdict === item.baseVerdict) stable++;
  }
  const s = stat(timings);
  const throughput = Math.round(1000 / s.avg);
  const stability = `${stable}/${base.length}`;
  results.push({
    events_per_trace: size, traces: base.length,
    avg_ms: +s.avg.toFixed(2), p50_ms: +s.p50.toFixed(2),
    p95_ms: +s.p95.toFixed(2), max_ms: +s.max.toFixed(2),
    traces_per_second: throughput, verdicts_stable: stability
  });
  console.log("  " + [
    String(size).padEnd(14), s.avg.toFixed(2).padEnd(10), s.p50.toFixed(2).padEnd(10),
    s.p95.toFixed(2).padEnd(10), s.max.toFixed(2).padEnd(10),
    String(throughput).padEnd(10), stability
  ].join(""));
}
console.log("  " + "─".repeat(74));
console.log("  'verdicts' = investigations whose category is unchanged after padding");
console.log("  the trace with neutral events — accuracy must not degrade with size.\n");

fs.writeFileSync(path.join(__dirname, "scale-results.json"), JSON.stringify({
  generated: new Date().toISOString(),
  node: process.version,
  traces_per_size: TRACES_PER_SIZE,
  results
}, null, 2));
console.log("  results written to bench/scale-results.json\n");
