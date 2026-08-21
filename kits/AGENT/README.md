# Agent Failure Investigator

**A forensic diagnostic tool for AI agents.** Upload a failed agent trace — from **LangGraph, OpenAI Agents SDK, CrewAI, AutoGen, Lamatic, or the native format** — and get a structured failure report with clickable evidence, a failure-propagation graph, a reconstructed timeline, a remediation playbook, and an exportable investigation document.

```
Upload trace.json  →  Auto-detect format  →  Convert  →  Investigate
```

| Supported input formats | |
|---|---|
| ✓ LangGraph | `astream_events` export |
| ✓ OpenAI Agents SDK | trace + spans export |
| ✓ CrewAI | crew/tasks/tool-usage export |
| ✓ AutoGen | chat history export |
| ✓ Lamatic | flow execution nodes |
| ✓ Native | `docs/trace-schema.md` |

Every adapter maps a framework's run log onto one canonical trace schema; the rule engine never knows which framework the trace came from.

Every AI team asks the same question: *why did the agent fail?* Today the answer means reading logs manually, re-reading prompts manually, and diffing tool calls manually. Agent Failure Investigator automates that investigation.

```
===================== FAILURE REPORT =====================
Failure Category      TOOL FAILURE
Confidence            87%   (evidence-weighted, capped at 95)
Evidence              [R11] book_table timed out after 10000ms
                      [R13] Fallback branch activated after the failure
Root Cause            The failure began in infrastructure, not in the
                      model. The flow continued to generation as if the
                      tool had succeeded, converting an infrastructure
                      error into a user-facing false statement.
Contributing Factors  Hallucination (+30) — unsupported claims in answer
Recommended Fixes     Add retries with backoff; make fallback honest
Preventive Actions    Alert on p95 tool latency; add circuit breaker
==========================================================
```

## Why the design is deterministic-first

The core of this tool is **not** an LLM. It is a **deterministic rule engine** (`rules/`): 13 pure functions over the trace, each producing evidence with references into the raw data, each contributing weighted points to one of five failure categories:

| Category | Detected by (examples) |
|---|---|
| Hallucination | R14 tool output ignored · R22 claims unsupported by any source |
| Tool Failure | R11 timeout · R12 error · R13 fallback after failure |
| Prompt Ambiguity | R31 contradictory instructions · R32 vague quantifiers · R33 output instability |
| Wrong Tool Selection | R41 better-matching tool available · R42 no re-plan after irrelevant result |
| RAG Failure | R21 empty retrieval before factual answer · R23 low relevance scores · R25 no retry |

The category with the most evidence points becomes the primary **Failure Category**; confidence is computed from evidence weight (`35 + 0.8 × points`, capped at 95 — an investigator reports evidence, never certainty). The engine also performs **conflict resolution**: root-cause rules suppress their downstream symptoms, so "the agent ignored the wrong tool's output" is attributed to *Wrong Tool Selection*, not misdiagnosed as hallucination.

The LLM enters only at the last step, and only optionally: it rewrites the Root Cause section as fluent prose from the engine's findings. It receives the fired rules as fixed facts and cannot add, remove, or reweigh evidence. An investigator that hallucinated its own findings would be useless — **diagnosis is deterministic; language is not.**

## Architecture

![Architecture — data flow from raw trace to investigation report](docs/architecture.svg)

The pipeline in one sentence: a raw framework export is claimed and translated by an adapter into one canonical trace schema; 13 pure rules produce evidence with references into the raw data; the engine resolves conflicts, weighs evidence into a category and a confidence, and reconstructs the timeline; the report layer turns that verdict into an investigation document, a propagation graph, a remediation playbook, and exports — with LLM narration as a strictly optional last-mile step that can rephrase but never decide.

<details>
<summary>Text version of the diagram (for terminal readers)</summary>

```
 trace.json (any supported framework)
        │
        ▼
┌──────────────────────┐
│ Format auto-detect    │  js/adapters.js — 6 adapters, each with
│ + Adapter             │  claim(doc) and translate(doc)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Normalizer            │  canonical trace schema (docs/trace-schema.md)
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Rule Engine           │  rules/ — one plugin file per failure class,
│ (pluggable)           │  each rule: pure test(trace) → evidence + refs
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Conflict Resolver     │  js/engine.js — root causes suppress symptoms
│ + Evidence Builder    │  scoring, confidence, timeline reconstruction
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ Report Generator      │  js/report.js + js/advisor.js + js/exporter.js
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│ UI                    │  propagation graph · ECG timeline · evidence
│                       │  · remediation playbook · A/B compare · export
└──────────────────────┘
```

</details>

The rule engine is a plugin system: dropping a new file into `rules/` that calls `definePlugin({ id, category, points, title, fix, prevention, test })` adds a detector — no engine change, no build step.

```
rules/
  core.js           categories, registry, shared text analysis
  hallucination.js  R14 · R22
  tool_failure.js   R11 · R12 · R13
  rag.js            R21 · R23 · R25
  prompt.js         R31 · R32 · R33
  wrong_tool.js     R41 · R42
```

## Quickstart

No build step, no dependencies, no API key required.

```
git clone <repo>
open index.html        # or just double-click it
```

Pick one of the five preloaded cases (one per failure category) and press **Run investigation** — or press **Upload trace.json** and drop in a raw export from LangGraph, OpenAI Agents SDK, CrewAI, AutoGen, or Lamatic; the format is detected and converted automatically. You can also paste a native-schema trace as JSON (schema in `docs/trace-schema.md`).

To run the regression tests and the benchmark:

```
node tests/run-tests.js
node bench/run.js 100      # accuracy benchmark (any N: 100 / 1000 / 10000)
node bench/scale.js        # latency vs trace size (100 / 1,000 / 10,000 events)
```

The suite asserts that all five sample cases classify into their expected category, that a healthy trace produces **no** diagnosis, that confidence stays in range, that every piece of evidence carries well-formed references into the raw trace, that each of the six adapters detects and converts its fixture correctly, and that the comparison and remediation layers behave.

## Benchmarks

Two benchmarks, both seeded and reproducible on any machine with `node` (numbers below: Node v22, single core, no warm cluster — this runs in a browser tab, so single-threaded cold performance is the honest measurement).

### 1 — Accuracy at dataset scale (`bench/run.js`)

`bench/run.js N` forges a seeded, labeled dataset of *N* traces across all five failure classes plus healthy runs (~28% adversarially mutated to sit near rule thresholds) and measures the engine against the labels. The class mix is proportional, so results are comparable across scales:

| Traces | Accuracy | False positives | False negatives | Misclassified | Avg / trace | p95 / trace |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 95.0% | 0.0% | 0.0% | 5.0% | 0.25 ms | 0.76 ms |
| 1,000 | 94.4% | 0.0% | 0.0% | 5.6% | 0.12 ms | 0.14 ms |
| 10,000 | 94.1% | 0.0% | 0.0% | 5.9% | 0.08 ms | 0.10 ms |

Accuracy is stable across scales (the ±1% drift is the adversarial mutation rate playing out over more samples, not degradation), and **no healthy trace is ever flagged and no failure is ever missed entirely** at any scale — every error is a wrong *category*, not a wrong *verdict*. Per-category recall at N=100: Tool Failure 100% · Hallucination 100% · Prompt Ambiguity 100% · RAG Failure 89% · Wrong Tool 77%. The misses are by construction — mutated traces where relevance scores hover at the threshold or the query genuinely overlaps both tools — and they end up misrouted to a *neighboring* category rather than missed. (Avg time per trace *decreasing* with N is JIT warm-up, not magic.)

### 2 — Latency vs trace size (`bench/scale.js`)

Real agent runs are not 8 events long. `bench/scale.js` takes 60 labeled traces, pads each with diagnostically neutral traffic (INFO logs, intermediate assistant turns, heartbeat tool calls — the noise a long-running agent actually produces) up to a target size, then measures the **full investigation** (rules + conflict resolution + scoring + timeline reconstruction) and asserts the verdict is identical to the verdict on the un-padded trace:

| Events / trace | Avg | p50 | p95 | Max | Throughput | Verdicts stable |
|---:|---:|---:|---:|---:|---:|---:|
| 100 | 0.24 ms | 0.17 ms | 0.61 ms | 0.79 ms | ~4,200 traces/s | 60/60 |
| 1,000 | 1.47 ms | 0.96 ms | 5.85 ms | 6.39 ms | ~680 traces/s | 60/60 |
| 10,000 | 11.83 ms | 9.03 ms | 32.85 ms | 85.98 ms | ~85 traces/s | 60/60 |

Two takeaways: latency grows **near-linearly** with trace size (rules are single-pass over the event arrays), and **classification is invariant to trace size** — a 10,000-event trace with the same failure buried inside gets the same diagnosis as an 8-event one, at every size, in every run. A 10,000-event investigation still completes in ~12 ms — fast enough to run on every failed production run, not just sampled ones.

Both benchmarks regenerate deterministically:

```
node bench/run.js 10000        # → bench/results.json
node bench/scale.js            # → bench/scale-results.json  (100 / 1,000 / 10,000 events)
node bench/scale.js 100 50000  # custom sizes
```

## Explainability graph & remediation

Every investigation renders a failure-propagation graph — `User → Prompt → Planner → Retriever → Tool → LLM → Answer` — with the stage that originated the failure highlighted in red and every downstream stage shown as contaminated. Below the fixes, a **remediation playbook** turns the diagnosis into concrete engineering patterns (retry policy, circuit breaker, groundedness gate, query reformulation, mutually-exclusive tool specs, …), each with a one-line rationale.

## Compare two runs

The **Compare** panel takes a Trace A (before the fix) and a Trace B (after), runs both investigations, and reports which rules were resolved, which persist, which are new, plus deltas on category, confidence, tool errors, and total tool latency — a regression test for agent fixes.

## Export

**Export Markdown** downloads the full investigation (timeline, evidence, root cause, recommendations, prevention, remediation playbook) as a `.md` file; **Export PDF** opens a print-formatted document ready to save as PDF.

## Optional LLM narration

Paste an Anthropic API key into the report panel and press **Compose with Claude** to have the Root Cause narrated as prose. The key lives in memory only and is never stored. If the call fails, the tool silently keeps the rule-based narrative — the report never depends on network access.

## What's in a trace

A trace is a single JSON object capturing one agent run (full schema with field-by-field docs in `docs/trace-schema.md`):

```json
{
  "system_prompt": "...",
  "conversation":   [{ "role": "user", "ts": "10:33:01", "content": "..." }],
  "available_tools":[{ "name": "...", "description": "..." }],
  "tool_calls":     [{ "ts": "...", "tool": "...", "input": {}, "status": "success|error|timeout", "duration_ms": 0, "output": "..." }],
  "retrieved_docs": [{ "id": "...", "source": "...", "score": 0.0, "content": "..." }],
  "logs":           [{ "ts": "...", "level": "INFO|WARN|ERROR", "event": "...", "message": "..." }],
  "final_response": { "ts": "...", "content": "..." }
}
```

This shape deliberately mirrors what agent platforms already log: the request lifecycle from prompt to response, with tools, retrieval, and infrastructure events in between.

## Future Lamatic Integration

This tool was designed so that its input maps one-to-one onto data Lamatic already has. A native integration would:

* **Read Flow Logs** — pull a failed run directly from Lamatic's real-time logs and traces instead of pasting JSON, using the flow's request lifecycle as the trace.
* **Analyze Tool Calls** — map node executions (tool nodes, timeouts, retries, fallback branches) onto the rule engine's tool-failure and wrong-tool rules.
* **Analyze Retrieval** — read vector search results and relevance scores from the RAG nodes to power the RAG-failure and groundedness rules.
* **Generate Failure Report** — attach the failure report to the run in the Logs view, so "why did this run fail?" is answered where the run lives, and *Recommended Fixes* link straight to the node that needs editing in the flow builder.

The rule catalog is intentionally a plain array: teams could ship their own rules per flow (e.g., "a booking confirmation must contain a confirmation id") the same way they ship prompts.

## Repository layout

```
index.html            app shell (zero build step)
css/style.css         diagnostic console theme
rules/                pluggable rule engine — one file per failure class
js/adapters.js        format auto-detection + 6 framework adapters
js/engine.js          rule runner, scoring, conflict resolution, timeline
js/graph.js           failure-propagation graph
js/advisor.js         remediation playbooks
js/exporter.js        Markdown / PDF investigation export
js/compare.js         before/after trace comparison
js/report.js          report composer (offline) + optional Claude narration
js/app.js             UI: import, case picker, ECG timeline, report, viewer
js/traces.js          5 sample failure cases
bench/forge.js        seeded trace synthesizer (+ neutral-event inflation)
bench/run.js          accuracy benchmark at dataset scale
bench/scale.js        latency-vs-trace-size benchmark
docs/architecture.svg architecture diagram (embedded above)
docs/trace-schema.md  canonical trace format documentation
tests/run-tests.js    regression tests (node, no dependencies)
```

## Known Limitations & Future Work

This system is **deterministic by design** — and that design has known, deliberate limits. Stating them precisely matters more than overstating what 13 rules can do.

### What the current system cannot do

* **Lexical, not semantic.** The groundedness and tool-affinity rules operate on token overlap and pattern shapes. Token overlap is not entailment, and a regex is not a semantic claim-checker: *"the parcel reached its destination"* and *"delivered"* are the same fact to a human and different strings to R22. Paraphrased hallucinations that reuse the source's vocabulary can slip through; correct answers phrased in fresh vocabulary can be flagged as unsupported.
* **Rule coverage is finite.** The engine detects the five failure classes it has rules for. Failure modes outside the catalog — looping/planning pathologies, context-window truncation, multi-agent coordination failures, prompt injection — currently produce either no diagnosis or a partial one.
* **Confidence is evidence weight, not calibrated probability.** `35 + 0.8 × points (cap 95)` is a transparent, monotone score — it is *not* a statistically calibrated probability. An 87 does not mean "correct 87% of the time"; it means "a lot of independent evidence fired."
* **The benchmark is synthetic.** The forged dataset (including its adversarial mutations) is generated by the same author as the rules. 94–95% accuracy on it demonstrates internal consistency and regression safety, not real-world recall. Numbers on production traces will be lower and messier — the benchmark's job is to keep the engine honest as it evolves, not to be a leaderboard claim.
* **Single-trace scope.** The engine diagnoses one run at a time. It does not yet aggregate across runs ("this tool times out on 4% of traffic, always between 14:00–15:00") — the fleet-level view is where the per-trace verdicts become operationally decisive.

Consequently: **the report is a strong lead for an engineer, not a verdict.** Every rule is cheap, explainable and auditable — that is the point of the design — but an investigator's output should be read as evidence, which is exactly why confidence is capped at 95.

### Planned next steps

1. **Semantic layer behind the same rule interface.** Embedding-based groundedness (claim ↔ source cosine similarity) and semantic tool-affinity as *additional* rules registered through the same `definePlugin` contract. The architecture anticipates this: rules already return evidence + refs, so a semantic rule slots in without touching the engine. The deterministic rules stay as the cheap, auditable first pass; embeddings become a second opinion, not a replacement.
2. **LLM-as-rule, sandboxed like the narrator.** For claim verification that embeddings can't settle, an optional LLM-backed rule whose output is constrained to the same `{ evidence, refs }` shape — subject to the same invariant that stochastic components may add *candidate* evidence but the deterministic scorer still decides.
3. **Calibration.** Once real labeled traces exist, fit the confidence mapping to observed precision (isotonic regression is enough) so 80 means 80.
4. **Cross-run aggregation.** Persist verdicts and mine them: recurring rule patterns per flow, tool-latency trends, regression detection tied into the existing A/B compare.
5. **Per-flow custom rules.** The rule catalog is a plain array precisely so teams can ship domain rules ("a booking confirmation must contain a confirmation id") the way they ship prompts.
