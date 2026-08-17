# Studio Build Checklist

EvidenceFit's two flows are **not exported into this repository yet**. Per
`apps/actions/orchestrate.ts`'s header comment: "these flows are built manually in
Lamatic Studio and are not part of this repository yet." This document is the exact,
node-by-node checklist Naman follows when building them by hand in Lamatic Studio, so
that a genuine Studio export — not a hand-authored graph — is what eventually lands at
`flows/evidence-fit-index.ts` and `flows/evidence-fit-evaluate.ts`.

Everything below is derived directly from three sources of truth already in this kit,
and this checklist must stay consistent with them:

- `apps/actions/orchestrate.ts` — the HTTP contract the Next.js app actually calls.
- `scripts/evidence-fit-index_prepare-chunks.ts` and
  `scripts/evidence-fit-evaluate_metrics.ts` — the two vendored code nodes, whose
  glue comments (below the `END VENDORED` marker) describe exactly what they expect to
  be bound to.
- `apps/lib/evidence/core.ts` — the deterministic engine both scripts vendor, in
  particular `computeVerdict`'s doc comment, which states plainly: *"In the deployed
  flow the API Response wires this value straight from the metrics code node, while the
  LLM node reaches only a separate `explanation` field."*

Until both flows are deployed and their IDs are set in `apps/.env.local`, the app runs
entirely in **local mode** (see README) — nothing below blocks local development.

---

## A known gap to close while building this

`orchestrate.ts`'s `runEvaluateFlow` currently sends the Evaluate flow only
`{ documentId, strategy, topK, cases: [{ id, question }] }` — no `documentText`, and no
evidence quotes. That is enough for the **rankings** half of the Evaluate flow (Section
2 below), but the Metrics code node (`evidence-fit-evaluate_metrics.ts`) needs
`documentText` and full evidence per case to compute a real verdict via
`resolveGoldSpans` / `compareStrategies`. Called with today's stripped-down payload, the
Metrics node will legitimately report `BLOCK` via a forced no-evidence validation issue
on every call.

This is **harmless for the app today** — `runEvaluateFlow` only reads
`response.rankings` and ignores every other field; the app computes its own verdict
locally, client-side, via the same vendored engine (see `runDeployed` →
`compareStrategies` in `orchestrate.ts`). But it means the deployed flow's own
`verdict` / `explanation` fields are not yet meaningful for a caller who skips the app
(e.g. a direct `curl`). Build the flow per this checklist anyway — the wiring is what
matters structurally — and track "extend `runEvaluateFlow` to also send `documentText`
and full evidence" as a follow-up so the flow's own verdict becomes trustworthy too.

---

## Flow 1: `evidence-fit-index`

Called once per strategy by `runIndexFlow`. Contract (from `orchestrate.ts`):

```
request:  { documentId: string; documentText: string; strategy: "fixed-width" | "clause-aware" }
response: { chunks: string[] }   // ordered chunk texts (pageContent)
```

| # | Node type | Node name | Configuration |
|---|---|---|---|
| 1 | API Request (`graphqlNode`) | Trigger | Input schema: `documentId` (string, required), `documentText` (string, required), `strategy` (string, required, enum `fixed-width` \| `clause-aware`). |
| 2 | Variables (`variablesNode`) | Strategy Chunk Config | Two fields, both expressions on `{{triggerNode_1.output.strategy}}`: `chunkSize` = `500` for either strategy; `chunkOverlap` = `50` when `fixed-width`, `0` when `clause-aware`. See callout below — this is the closest built-in approximation of `CLAUSE_CONFIG`, not an exact match. |
| 3 | Chunking (`chunkNode`) | Chunk Document | Text input bound to `{{triggerNode_1.output.documentText}}`. Bind **Chunk Size** and **Chunk Overlap** to `{{variablesNode_2.output.chunkSize}}` / `{{variablesNode_2.output.chunkOverlap}}` instead of typing static numbers, so one flow serves both strategies across its two calls. |
| 4 | Code (`codeNode`) | Prepare Chunks | Paste `@scripts/evidence-fit-index_prepare-chunks.ts` verbatim. Bind `{{triggerNode_1.output}}` (whole node output) and `{{chunkNode_3.output.chunks}}` (whole node output via the `(x)` picker — nested paths render grey and resolve inconsistently in Studio). Update the two `{{triggerNode_1...}}` / `{{chunkNode_968...}}` placeholder ids in the pasted script to your actual node ids, or rename your nodes to match them — either works. |
| 5 | Condition (`conditionNode`) | Skip Gate | Branch on `{{codeNode_4.output.ok}}`. `false` → route straight to API Response (step 8) with an empty/error payload. `true` → continue to step 6. This is the "downstream nodes must skip when `output.ok === false`" rule from the script's own header comment. |
| 6 | Vectorize (`vectorizeNode`) | Embed Chunks | Input **requires** `string[]`; bind to `{{codeNode_4.output.texts}}`. |
| 7 | Index (`vectorNode`) | Index Chunks | Upsert embeddings. Metadata bound to `{{codeNode_4.output.metadata}}` (a parallel array, one entry per text above) carrying `experimentId`, `documentId`, `strategy`, `chunkId`, `start`, `end`, `content` — this is what lets the Evaluate flow rebuild real `Chunk` objects from search-result metadata later. Composite primary key: `documentId` + `strategy` + `chunkId`. `experimentId` is deliberately **not** part of the key: re-running an experiment against the same document and strategy cleanly replaces the prior vectors (same document ⇒ same chunk boundaries ⇒ idempotent upsert) instead of accumulating stale duplicates. |
| 8 | API Response (`graphqlResponseNode`) | Response | outputMapping (exact JSON below). |

**Index flow API Response `outputMapping`:**

```json
{
  "chunks": "{{codeNode_4.output.texts}}",
  "ok": "{{codeNode_4.output.ok}}",
  "issues": "{{codeNode_4.output.issues}}"
}
```

`chunks` is the field `orchestrate.ts`'s `runIndexFlow` actually reads
(`asStringArray(parsed.chunks)`); `ok` / `issues` are extra and safe — the app ignores
unknown fields.

**Callout — chunkNode vs. the vendored chunking functions:** `apps/lib/evidence/core.ts`
computes `spanIntegrityRate` / `boundarySeveredCount` (whether a chunk boundary severs a
gold span) by running its **own** idealized `fixedWidthChunks()` / `clauseAwareChunks()`
directly against `documentText` — this happens inside `evaluateStrategy()` regardless of
deployed vs. local mode, and it does **not** consult Studio's real `chunkNode` output for
that specific metric. Studio's `chunkNode` output is used only to build the real vector
index and real per-question rankings (via `alignChunks`). Lamatic's built-in splitter has
no true clause-terminator mode, so it cannot exactly reproduce `clauseAwareChunks()`.
Configure step 3 as close to `FIXED_WIDTH_CONFIG` (`500`/`50`) and `CLAUSE_CONFIG`
(`500`/`0`, sentence- or paragraph-aware splitting if your chunkNode offers it) as
Studio allows — the closer the real splitter matches the idealized functions, the more
the theoretical `spanIntegrityRate` reflects what is actually retrievable in production.
A mismatch here does not break anything computationally; it just weakens how well the
metric maps to your real index.

---

## Flow 2: `evidence-fit-evaluate`

Called once per strategy by `runEvaluateFlow`. Contract (from `orchestrate.ts`):

```
request:  { documentId: string; strategy: "fixed-width" | "clause-aware"; topK: number;
            cases: { id: string; question: string }[] }
response: { rankings: Record<caseId, string[]> }
```

The Metrics code node (`evidence-fit-evaluate_metrics.ts`) additionally wants
`experimentId`, `documentText`, full `cases` (with evidence), and `alignmentIssues` — see
the "known gap" callout above. Build the trigger schema to accept the union of both so
the flow is ready once `orchestrate.ts` is extended.

Both strategies were indexed into the **same** vector collection, distinguished only by
`metadata.strategy` (Flow 1, step 7). So every search below **must filter on both
`experimentId` and `strategy`** — omitting either lets one experiment's or one strategy's
chunks leak into another's ranking, which is exactly the cross-experiment contamination
the metadata schema exists to prevent.

| # | Node type | Node name | Configuration |
|---|---|---|---|
| 1 | API Request (`graphqlNode`) | Trigger | Input schema: `experimentId` (string), `documentId` (string), `documentText` (string, optional today — see gap callout), `strategy` (string, enum `fixed-width` \| `clause-aware`), `topK` (number), `cases` (array of `{ id, question, evidence?, required? }`), `alignmentIssues` (array, optional, forwarded from the Index flow's `issues`). |
| 2 | Loop (`forLoopNode`) | Cases Loop | Iterate `{{triggerNode_1.output.cases}}`. |
| 3 | Vector Search (`searchNode`) | Search Fixed-Width | Inside the loop. Query = current item's `question`. Filter = `{ experimentId: {{triggerNode_1.output.experimentId}}, strategy: "fixed-width" }`. Fetch a bit more than `topK` (e.g. `10`) so the Metrics node has enough breadth to compute `firstCompleteEvidenceRank` beyond the cutoff. |
| 4 | Vector Search (`searchNode`) | Search Clause-Aware | Same as step 3, filter `strategy: "clause-aware"`. Both searches run on **every** call regardless of the trigger's own `strategy` value — this is what lets the Metrics node compute the full baseline-vs-candidate comparison from a single call, matching `compareStrategies`, which always needs both sides. |
| 5 | Variables (`variablesNode`) | Combine Case Results | Merge the two search nodes' hits for this loop item into one array (`entry.results`), each hit still carrying its own `metadata.strategy` so downstream code can split them back apart. Loop output: `searchResults: [{ caseId: <item.id>, results: [...] }, ...]`. |
| 6 | Code (`codeNode`) | Metrics | Paste `@scripts/evidence-fit-evaluate_metrics.ts` verbatim. Bind `{{triggerNode_1.output}}` and `{{forLoopNode_2.output.searchResults}}` (whole loop output via the `(x)` picker) to the script's `{{triggerNode_1.output}}` / `{{searchNode_1.output}}` placeholders — update those two ids in the pasted script, or rename your nodes to match. Output: `{ ok, verdict, issues, baseline, candidate, recommended }`. |
| 7 | Code (`codeNode`) | Build Rankings | **Inline in Studio — not externalized to `@scripts/`**, since it is a small per-flow transform, not shared engine logic. Filters the same combined per-case results down to the trigger's own `strategy`, preserves search-rank order, and maps each hit to its chunk text — this is the field `orchestrate.ts` actually consumes. See exact code below. |
| 8 | LLM (`LLMNode`) | Explain Verdict | System prompt: `@prompts/evidence-fit-evaluate_llm-node_system.md`. User message: bound directly to `{{codeNode_6.output}}` (whole node output) via Studio's inline prompt editor — not externalized, since it is pure data-binding with no static instructional text of its own. Model config: `@model-configs/evidence-fit-evaluate_llm-node.ts`. |
| 9 | API Response (`graphqlResponseNode`) | Response | outputMapping (exact JSON below). **Read the callout after the JSON before wiring this node.** |

**Build Rankings — exact inline code for step 7:**

```js
const strategy =
  {{triggerNode_1.output.strategy}} === "clause-aware" ? "clause-aware" : "fixed-width";
const searchResults = {{forLoopNode_2.output.searchResults}} || [];

const rankings = {};
for (const entry of searchResults) {
  const caseId = entry && (entry.caseId || entry.id);
  if (!caseId) continue;
  const hits = Array.isArray(entry.results) ? entry.results : [];
  rankings[caseId] = hits
    .filter((h) => h && h.metadata && h.metadata.strategy === strategy)
    .map((h) => h.metadata.content)
    .filter((t) => typeof t === "string" && t.length > 0);
}

output = rankings;
```

**Evaluate flow API Response `outputMapping` — CRITICAL:**

```json
{
  "rankings": "{{codeNode_7.output}}",
  "verdict": "{{codeNode_6.output.verdict}}",
  "ok": "{{codeNode_6.output.ok}}",
  "issues": "{{codeNode_6.output.issues}}",
  "baseline": "{{codeNode_6.output.baseline}}",
  "candidate": "{{codeNode_6.output.candidate}}",
  "recommended": "{{codeNode_6.output.recommended}}",
  "explanation": "{{llmNode_8.output.text}}"
}
```

**`verdict` and every metric field must be wired from the Metrics code node (step 6)
only. The LLM node's output (step 8) must be mapped into `explanation` and nothing
else — never into `verdict`, never into `baseline`/`candidate`/`recommended`.** This is
the exact wiring `computeVerdict`'s doc comment in `core.ts` describes as making the
verdict "structurally impossible for the model to override": there is no graph path from
the LLM node to `verdict`, so no prompt-injection attempt inside the document text or an
evidence quote can change what the app or a direct API caller sees as the accept/reject
decision. Double-check this mapping specifically during review — it is the single wire
that the constitution's guarantee depends on.

`rankings` is read by `orchestrate.ts`'s `runEvaluateFlow`
(`asRecord(parsed.rankings)`); the rest are extra fields it currently ignores (see the
gap callout above).
