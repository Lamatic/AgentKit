# Studio Build Checklist

EvidenceFit's two flows are **not exported into this repository yet**. Per
`apps/actions/orchestrate.ts`'s header comment, "these flows are built manually in
Lamatic Studio and are not part of this repository yet." This document is the exact,
node-by-node checklist Naman follows when building them by hand in Lamatic Studio, so
that a genuine Studio export — not a hand-authored graph — is what eventually lands at
`flows/evidence-fit-index.ts` and `flows/evidence-fit-evaluate.ts`.

Everything below is derived directly from three sources of truth already in this kit,
and this checklist must stay consistent with them:

- `apps/actions/orchestrate.ts` — the HTTP contract the Next.js app actually calls. The
  app never recomputes metrics or the verdict in deployed mode — it renders whatever
  `Comparison` the Evaluate flow hands back, once that response's shape has been
  validated. Both flow calls for one experiment run happen in this fixed order: the
  Index flow once per strategy, then the Evaluate flow once for the whole experiment.
- `scripts/evidence-fit-index_prepare-chunks.ts` and
  `scripts/evidence-fit-evaluate_metrics.ts` — the two vendored code nodes, whose
  glue comments (below the `END VENDORED` marker) describe exactly what they expect to
  be bound to. Neither script needed a code change for this contract — both already
  read `experimentId`, `documentText` and full `cases` (with evidence) from their
  trigger, and the Metrics node already computes both strategies from a single call.
  Only `orchestrate.ts` and this checklist were behind that contract; wiring them up
  correctly is what this document does.
- `apps/lib/evidence/core.ts` — the deterministic engine both scripts vendor, in
  particular `computeVerdict`'s doc comment, which states plainly: *"In the deployed
  flow the API Response wires this value straight from the metrics code node, while the
  LLM node reaches only a separate `explanation` field."*

Until both flows are deployed and their IDs are set in `apps/.env.local`, the app runs
entirely in **local mode** (see README) — nothing below blocks local development.

---

## Flow 1: `evidence-fit-index`

Called once per strategy by `runIndexFlow`. Contract (from `orchestrate.ts`):

```
request:  { experimentId: string; documentId: string; documentText: string;
            strategy: "fixed-width" | "clause-aware" }
response: { ok: boolean; indexedCount: number; issues?: ValidationIssue[] }
```

| # | Node type | Node name | Configuration |
|---|---|---|---|
| 1 | API Request (`graphqlNode`) | Trigger | Input schema: `experimentId` (string, required), `documentId` (string, required), `documentText` (string, required), `strategy` (string, required, enum `fixed-width` \| `clause-aware`). `experimentId` is what lets the Index node (step 5) stamp every vector's metadata with the experiment it belongs to — without it, every experiment's vectors would collide under the same blank id and the Evaluate flow's per-experiment search filter (see Flow 2) could never distinguish them. |
| 2 | Code (`codeNode`) | Prepare Chunks | Paste `@scripts/evidence-fit-index_prepare-chunks.ts` verbatim. Bind `{{triggerNode_1.output}}` (whole node output) — this node reads ONLY the trigger; there is no chunk node feeding it. Update the `{{triggerNode_1...}}` placeholder id in the pasted script to your actual trigger node id, or rename your node to match it. This node generates chunks itself, deterministically, by selecting `FIXED_WIDTH_CONFIG` / `CLAUSE_CONFIG` from `strategy` (rejecting any unrecognised value rather than defaulting) and calling the matching vendored `fixedWidthChunks()` / `clauseAwareChunks()` directly against `documentText`. Output: `{ ok, issues, texts, metadata }`. |
| 3 | Condition (`conditionNode`) | Skip Gate | Branch on `{{codeNode_2.output.ok}}`. `false` → route straight to API Response (step 6) with `indexedCount: 0`. `true` → continue to step 4. This is the "downstream nodes must skip when `output.ok === false`" rule from the script's own header comment. |
| 4 | Vectorize (`vectorizeNode`) | Embed Chunks | Input **requires** `string[]`; bind to `{{codeNode_2.output.texts}}`. |
| 5 | Index (`vectorNode`) | Index Chunks | Upsert embeddings. Metadata bound to `{{codeNode_2.output.metadata}}` (a parallel array, one entry per text above) carrying `experimentId`, `documentId`, `strategy`, `chunkId`, `start`, `end`, `content` — this is what lets the Evaluate flow rebuild real `Chunk` objects from search-result metadata later. Composite primary key: `documentId` + `strategy` + `chunkId`. `experimentId` is deliberately **not** part of the key: re-running an experiment against the same document and strategy cleanly replaces the prior vectors (same document ⇒ same chunk boundaries ⇒ idempotent upsert) instead of accumulating stale duplicates. |
| 6 | API Response (`graphqlResponseNode`) | Response | outputMapping (exact JSON below). |

**Index flow API Response `outputMapping`:**

```json
{
  "ok": "{{codeNode_2.output.ok}}",
  "indexedCount": "{{codeNode_2.output.texts.length}}",
  "issues": "{{codeNode_2.output.issues}}"
}
```

`ok` and `indexedCount` are the fields `orchestrate.ts`'s `runIndexFlow` actually reads —
it treats anything other than `ok: true` with `indexedCount > 0` as a failure and never
proceeds to the Evaluate flow for that experiment. `indexedCount` is bound to
`texts.length` rather than a dedicated field because `texts` and `metadata` are always
the same length (one entry per successfully generated chunk, both empty on failure), so
either works identically. `issues` is extra and safe — the app ignores unknown fields.

**Note — why this flow does not use `chunkNode`:** The Index code node (step 2) generates
chunks itself, deterministically, by calling the vendored `fixedWidthChunks()` /
`clauseAwareChunks()` directly against `documentText` — the exact same pure functions
`evaluateStrategy()` in `apps/lib/evidence/core.ts` calls when the Evaluate flow's Metrics
node computes `spanIntegrityRate` and `boundarySeveredCount`. Because both flows
regenerate chunks from the identical `documentText` through the identical pure function,
the chunks that get indexed here and the chunks the metrics are computed against are
byte-identical by construction — there is no separate chunker output to approximate or
keep in sync, and no drift for the metrics to silently describe a configuration other
than the one actually deployed to the vector index. A Lamatic `chunkNode` (or any other
real chunker) would reintroduce exactly that gap: its splitter has no true
clause-terminator mode, so it cannot reproduce `clauseAwareChunks()` at all, and even for
the fixed-width strategy its output would only ever approximate `fixedWidthChunks()`'s
boundaries. `alignChunks()` still lives in `core.ts` — exported and covered by
`apps/__tests__/` — as the utility for recovering verified offsets when chunk text
arrives from an external, already-chunked source that reports no offsets of its own; it
is simply not on this flow's critical path.

---

## Flow 2: `evidence-fit-evaluate`

Called **once for the whole experiment** by `runEvaluateFlow` — not once per strategy.
Both strategies are searched and scored inside this single call, since the Metrics code
node (step 6) always runs the vendored `compareStrategies` across both sides at once.
Contract (from `orchestrate.ts`):

```
request:  { experimentId: string; documentId: string; documentText: string; topK: number;
            cases: { id: string; question: string;
                     evidence: { quote: string; start?: number; end?: number }[];
                     required?: boolean }[] }
response: { verdict: "SHIP" | "TUNE" | "BLOCK";
            baseline: StrategyResult; candidate: StrategyResult;
            recommended: "fixed-width" | "clause-aware" | "neither";
            explanation?: string; ok?: boolean; issues?: ValidationIssue[] }
```

`orchestrate.ts` reads `verdict`, `baseline`, `candidate` and `recommended` straight off
this response — it validates their shape (a real `Verdict` enum value, both strategy
results present with valid numeric rate objects and a `cases` array) and, if that
validation fails, returns a typed `upstream` error rather than falling back to computing
anything itself. It never reads `rankings`, because nothing downstream needs raw ranked
chunk text once the flow computes the full comparison itself.

Both strategies were indexed into the **same** vector collection, distinguished only by
`metadata.strategy` (Flow 1, step 5). So every search below **must filter on both
`experimentId` and `strategy`** — omitting either lets one experiment's or one strategy's
chunks leak into another's ranking, which is exactly the cross-experiment contamination
the metadata schema exists to prevent.

| # | Node type | Node name | Configuration |
|---|---|---|---|
| 1 | API Request (`graphqlNode`) | Trigger | Input schema: `experimentId` (string, required), `documentId` (string, required), `documentText` (string, required), `topK` (number, required), `cases` (array of `{ id, question, evidence: [{ quote, start?, end? }], required? }`, required), `alignmentIssues` (array, optional — a direct API caller that ran its own Index step may forward its `issues` here; `orchestrate.ts` never populates it, since it already stops before calling this flow if either Index call fails). |
| 2 | Loop (`forLoopNode`) | Cases Loop | Iterate `{{triggerNode_1.output.cases}}`. |
| 3 | Vector Search (`searchNode`) | Search Fixed-Width | Inside the loop. Query = current item's `question`. Filter = `{ experimentId: {{triggerNode_1.output.experimentId}}, strategy: "fixed-width" }`. Fetch a bit more than `topK` (e.g. `10`) so the Metrics node has enough breadth to compute `firstCompleteEvidenceRank` beyond the cutoff. |
| 4 | Vector Search (`searchNode`) | Search Clause-Aware | Same as step 3, filter `strategy: "clause-aware"`. Both searches run on **every** call — this is what lets the Metrics node compute the full baseline-vs-candidate comparison from a single call, matching `compareStrategies`, which always needs both sides. |
| 5 | Variables (`variablesNode`) | Combine Case Results | Merge the two search nodes' hits for this loop item into one array (`entry.results`), each hit still carrying its own `metadata.strategy` so downstream code can split them back apart. Loop output: `searchResults: [{ caseId: <item.id>, results: [...] }, ...]`. |
| 6 | Code (`codeNode`) | Metrics | Paste `@scripts/evidence-fit-evaluate_metrics.ts` verbatim. Bind `{{triggerNode_1.output}}` and `{{forLoopNode_2.output.searchResults}}` (whole loop output via the `(x)` picker) to the script's `{{triggerNode_1.output}}` / `{{searchNode_1.output}}` placeholders — update those two ids in the pasted script, or rename your nodes to match them. Output: `{ ok, verdict, issues, baseline, candidate, recommended }`. This is the only node in the flow that computes `verdict`, and it needs no per-call `strategy` input — it always evaluates both. |
| 7 | LLM (`LLMNode`) | Explain Verdict | System prompt: `@prompts/evidence-fit-evaluate_llm-node_system.md`. User message: bound directly to `{{codeNode_6.output}}` (whole node output) via Studio's inline prompt editor — not externalized, since it is pure data-binding with no static instructional text of its own. Model config: `@model-configs/evidence-fit-evaluate_llm-node.ts`. |
| 8 | API Response (`graphqlResponseNode`) | Response | outputMapping (exact JSON below). **Read the callout after the JSON before wiring this node.** |

**Evaluate flow API Response `outputMapping` — CRITICAL:**

```json
{
  "verdict": "{{codeNode_6.output.verdict}}",
  "ok": "{{codeNode_6.output.ok}}",
  "issues": "{{codeNode_6.output.issues}}",
  "baseline": "{{codeNode_6.output.baseline}}",
  "candidate": "{{codeNode_6.output.candidate}}",
  "recommended": "{{codeNode_6.output.recommended}}",
  "explanation": "{{llmNode_7.output.text}}"
}
```

**`verdict` and every metric field must be wired from the Metrics code node (step 6)
only. The LLM node's output (step 7) must be mapped into `explanation` and nothing
else — never into `verdict`, never into `baseline`/`candidate`/`recommended`.** This is
the exact wiring `computeVerdict`'s doc comment in `core.ts` describes as making the
verdict "structurally impossible for the model to override": there is no graph path from
the LLM node to `verdict`, so no prompt-injection attempt inside the document text or an
evidence quote can change what the app or a direct API caller sees as the accept/reject
decision. Double-check this mapping specifically during review — it is the single wire
that the constitution's guarantee depends on.

`verdict`, `baseline`, `candidate` and `recommended` are the fields `orchestrate.ts`'s
`runEvaluateFlow` actually reads and validates before trusting; `ok` / `issues` /
`explanation` are extra and safe — the app ignores unknown fields and never reads
`explanation` into anything that could reach `Comparison`.
