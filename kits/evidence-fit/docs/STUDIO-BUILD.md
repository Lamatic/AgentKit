# Studio Build Checklist

EvidenceFit's two flows are **not exported into this repository yet**. Per
`apps/actions/orchestrate.ts`'s header comment, "these flows are built manually in
Lamatic Studio and are not part of this repository yet." This document is the exact
checklist Naman follows when building them by hand in Lamatic Studio, so that a genuine
Studio export — not a hand-authored graph — is what eventually lands at
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

Also referenced below, for facts specific to Lamatic Studio itself: the
[flow config](https://lamatic.ai/docs/flows/flow-config) docs, the
[flow editor](https://lamatic.ai/docs/flows/editor) docs, the
[GraphQL trigger/response](https://lamatic.ai/docs/interface/graphql) docs, the
[VectorDB node](https://lamatic.ai/docs/nodes/data/vectordb-node) docs, the
[Vectorize node](https://lamatic.ai/docs/nodes/data/vectorize-node) docs, and the
[node catalogue](https://lamatic.ai/docs/nodes) — cross-checked against real Studio
exports already committed in this repo (`kits/point-proven/`, `kits/api-change-review/`,
`kits/github-manager/`, `kits/scam-shield/`, and others under `kits/*/flows/*.ts`).
**Where Lamatic's published docs and a real export disagree, the real export wins** —
it comes from a flow that actually deploys, and every disagreement found is called out
explicitly below.

Until both flows are deployed and their IDs are set in `apps/.env.local`, the app runs
entirely in **local mode** (see README) — nothing below blocks local development.

---

## Before you start — known gotchas

These four are the ones most likely to silently break the flow. Read them before
placing a single node.

### 1. It's `responeType`, not `responseType` — and Studio requires the misspelling

Lamatic's own [GraphQL trigger docs](https://lamatic.ai/docs/interface/graphql) write
the trigger field as `responseType`. **Every real export in this repo uses
`responeType` (no `s`).** Counted across all exported flows in this repo:
`responeType` appears 191 times, `responseType` 3 times. If you type the field the way
the docs spell it, Studio will not recognize it and the GraphQL trigger's response mode
is left unconfigured.

Valid values seen in real exports: `realtime` and `async`. Use `realtime` for **both**
EvidenceFit flows, because `apps/actions/orchestrate.ts` calls `client.executeFlow(...)`
and awaits the result directly — it never polls for an async result.

### 2. `advance_schema` is a JSON-encoded STRING, not an object

Real example, from `kits/api-change-review/flows/api-review-review.ts`:

```
"advance_schema": "{\n  \"changes\": \"[string]\",\n  \"totalChanges\": \"int\",\n  \"oldVersion\": \"string\",\n  \"newVersion\": \"string\",\n  \"endpointsTouched\": \"[string]\",\n  \"audience\": \"string\"\n}"
```

It is not YAML, not a live JSON object, not a place for `required`/`enum` modifiers —
it is a string whose *contents* happen to be a small JSON object mapping field name to
type name. The type vocabulary confirmed across every export in this repo is exactly:
`string`, `int`, `bool`, `float`, `[string]`.

**There is no `[object]` or object type.** `[string]` is the only array form seen
anywhere. This directly affects the Evaluate flow's trigger, whose `cases` field is an
array of objects (`{ id, question, evidence: [...], required? }`) — there is no schema
type that can express that shape. Two workable options:

- **(a)** Declare `cases` as plain `string` and send it JSON-encoded text, parsing it in
  the Metrics code node.
- **(b)** Leave `advance_schema: ""` entirely for that trigger. `kits/point-proven/flows/index-articles.ts`
  does exactly this — its trigger has `"advance_schema": ""` — and successfully passes
  an array (`urls`) through untyped.

**Recommended: (b).** It needs no code change anywhere. Option (a) would require a
matching change in `apps/actions/orchestrate.ts` (JSON-stringifying `input.cases` before
the flow call, and un-stringifying it in the Metrics node), which this checklist does
not ask you to make. See Flow 2, step 1 below for the concrete trigger schema this
implies.

### 3. No object/array-of-object type at all — keep this in mind everywhere

This is the same fact as #2, restated as a general rule: whenever a Studio schema field
(a trigger's `advance_schema`, or any other JSON-typed config value) needs to describe
something shaped like an object or a list of objects, there is no type for it. Either
flatten it to scalars, pass it as an untyped/opaque JSON string, or — as with `cases`
above — leave the schema empty and let the receiving code node parse the raw payload
itself.

### 4. Fields of type `model` or marked `isCredential: true` cannot be set from YAML — only Studio's picker can

This is now the **second time** the YAML path has blocked the builder, so read this
before touching the Config tab.

Any node field declared `"type": "model"` in a flow's `inputs` block, or marked
`isCredential: true`, cannot be authored through the Config tab's YAML. Studio only ever
writes a valid value for these fields through its own node-configuration-panel picker,
because the value it stores includes a `credentialId` UUID that Studio mints
server-side the moment a credential is attached to the Studio project — there is no way
to type that UUID by hand before it exists.

Real value from a deployed flow
(`kits/api-change-review/model-configs/api-review-review_llmnode-804_generative-model-name.ts`):

```js
{
  "type": "generator/text",
  "params": {},
  "configName": "configA",
  "model_name": "gpt-4o-mini",
  "credentialId": "21c20b7c-263a-44c7-ac73-dc8f216f9232",
  "provider_name": "openai",
  "credential_name": "gpt-4o-mini"
}
```

The `credentialId` cannot be authored by hand.

The three fields in **this kit's** build that are affected:

- LLM node → **Generative Model Name** (Flow 2 only)
- Vectorize node → **Embedding Model Name** (Flow 1)
- VectorDB node → **Vector DB** (Flow 1), and the Vector Search nodes' vector DB
  selection (Flow 2)

Working order, stated plainly: attach the credentials and the Vector DB to the Studio
project **first**, then paste YAML for the graph shape, then open each of those nodes
individually and set its picker by hand. YAML gets you the graph; the pickers get you
the connections — YAML cannot do both, no matter how the field is spelled.

This kit already declares its intended model at
`model-configs/evidence-fit-evaluate_llm-node.ts` (`gpt-4o-mini`, provider `openai`),
with `credentialId` and `credential_name` deliberately left blank. Pick that same model
— an OpenAI `gpt-4o-mini` (or equivalent chat-completion) credential — in the Explain
Verdict node's picker, and Studio fills the blank fields in for you on export.

---

## Partial accelerator: seed the graph from the Config tab (YAML)

**This is not the build path — it is a head start on part of it.** The canonical,
start-to-finish build path is the visual (canvas) editor, as
[`STUDIO-STEPS.md`](./STUDIO-STEPS.md) sets out. Read that first; come back here for the
field-level reference.

Why the Config tab cannot finish either flow, restated from the two gotchas above:

- Every `model` / `isCredential` / vector-database field is a **picker only** (gotcha
  #4) — YAML physically cannot author the `credentialId` UUID Studio mints server-side.
  That covers the Vectorize node's embedding model, the VectorDB node, both Vector
  Search nodes, and the Explain Verdict LLM node.
- The **Condition** node (Flow 1's Skip Gate), the **Loop** node (Flow 2's Cases Loop)
  and the **Vector Search** node have no Config-tab YAML shape confirmed by any source
  consulted for this document — and a Condition's `condition` field embeds an
  auto-generated edge id, while a Loop must be paired to its `forLoopEndNode` by an id
  Studio mints when you draw the connection. Guessing at these silently breaks
  branching, looping or search instead of raising an error.

What the Config tab *is* good for here: seeding the plain nodes (trigger, code,
response) so you place fewer nodes by hand, and **inspecting** a flow you have already
built. Ready-made seeds for both flows live in
[`studio-configs/`](./studio-configs/README.md) — apply one, then finish every node
listed above in the canvas editor. The node-by-node tables further down are the
reference for what each node's `values` must contain.

The YAML has exactly three top-level sections — `triggerNode`, `nodes`, `responseNode`
— and each node carries `nodeId`, `nodeType`, `nodeName`, `values`, and a `needs` array
listing its dependencies (which controls execution order). Template variables are
`{{nodeId.output.fieldName}}`.

Documented skeleton (this is Lamatic's own docs example, with `responeType` corrected to
the spelling Studio actually uses — see gotcha #1):

```yaml
triggerNode:
  nodeId: triggerNode_1
  nodeType: graphqlNode
  nodeName: API Request
  values:
    advance_schema: '{"input": "string"}'
    responeType: realtime

nodes:
  - nodeId: LLMNode_187
    nodeType: LLMNode
    nodeName: Text Generate
    values:
      promptTemplate: "Prompt {{triggerNode_1.output.input}}"
    needs:
      - triggerNode_1

responseNode:
  nodeId: responseNode_triggerNode_1
  nodeType: graphqlResponseNode
  nodeName: API Response
  values:
    outputMapping: '{"output": "{{LLMNode_187.output.generatedResponse}}"}'
  needs:
    - LLMNode_187
```

**This skeleton illustrates STRUCTURE ONLY — do not paste it into either EvidenceFit
flow verbatim.** It is Lamatic's own generic example, and its one node (`LLMNode_187` /
"Text Generate") does not exist in either flow you are building: Flow 1
(`evidence-fit-index`) has **no LLM node at all**, and Flow 2 (`evidence-fit-evaluate`)'s
only LLM node is named "Explain Verdict", not "Text Generate". If you paste the skeleton
as-is and adapt around it, the stray "Text Generate" node survives and blocks saving
with `Unconfigured Text Generate — Fill required field Generative Model Name before
saving the flow` — and that field can't even be fixed from YAML (gotcha #4 above, since
`generativeModelName` is a `type: "model"` field). Delete the example `LLMNode_187` node
entirely before adapting this skeleton to either flow's real node table below.

**Where the confidence behind each node type comes from:** every node type shown
concretely in this checklist's tables (`graphqlNode`, `codeNode`, `vectorizeNode`,
`vectorNode`, `searchNode`, `LLMNode`, `graphqlResponseNode`) has confirmed `values`
field names, because they come from real Studio exports already committed in this repo
— including the Vector Search node's fields, closed out below in Flow 2 from a real
deployed export. The **Condition node** (Flow 1's Skip Gate) and the **Loop node**
(Flow 2's Cases Loop) do not have a YAML shape confirmed by any source consulted for
this document — real exports show these node types' *raw graph JSON* (see e.g.
`conditionNode_942` in `kits/api-change-review/flows/api-review-review.ts`), not their
Config-tab YAML equivalent. The **Vector Search node** is now in between: its raw
`values` field names are confirmed (see Flow 2 below), but its Config-tab YAML
translation is not — no source consulted for this document shows a `searchNode` entry
inside the YAML `nodes:` list, only the raw graph JSON Studio exports. Place all three of
these node types with the visual node editor — guessing at their YAML would silently
break branching, looping, or search rather than raising an error.

---

## Flow 1: `evidence-fit-index`

Called once per strategy by `runIndexFlow`. Contract (from `orchestrate.ts`):

```
request:  { experimentId: string; documentId: string; documentText: string;
            strategy: "fixed-width" | "clause-aware" }
response: { ok: boolean; indexedCount: number; issues?: ValidationIssue[] }
```

Node ids below follow the `<nodeType>_<step#>` pattern so the outputMapping at the end
can reference them unambiguously.

| # | Node type | Node name | Configuration |
|---|---|---|---|
| 1 | API Request (`graphqlNode`) | Trigger (`triggerNode_1`) | Fields: `experimentId`, `documentId`, `documentText`, `strategy`. `experimentId` is what lets the Index node (step 5) stamp every vector's metadata with the experiment it belongs to — without it, every experiment's vectors would collide under the same blank id and the Evaluate flow's per-experiment search filter (see Flow 2) could never distinguish them. `strategy` is expected to be `"fixed-width"` or `"clause-aware"`; the schema type system has no enum modifier (see gotcha #2), so that validity check is enforced by the Prepare Chunks code node (step 2) rejecting any unrecognised value, not by the schema. `advance_schema`: `'{"experimentId":"string","documentId":"string","documentText":"string","strategy":"string"}'`. `responeType: realtime` (gotcha #1). |
| 2 | Code (`codeNode`) | Prepare Chunks (`codeNode_2`) | Paste `@scripts/evidence-fit-index_prepare-chunks.ts` verbatim. Bind `{{triggerNode_1.output}}` (whole node output) — this node reads ONLY the trigger; there is no chunk node feeding it. Update the `{{triggerNode_1...}}` placeholder id in the pasted script to your actual trigger node id, or rename your node to match it. This node generates chunks itself, deterministically, by selecting `FIXED_WIDTH_CONFIG` / `CLAUSE_CONFIG` from `strategy` (rejecting any unrecognised value rather than defaulting) and calling the matching vendored `fixedWidthChunks()` / `clauseAwareChunks()` directly against `documentText`. Output: `{ ok, issues, texts, metadata }`. |
| 3 | Condition (`conditionNode`) | Skip Gate (`conditionNode_3`) | Branch on `{{codeNode_2.output.ok}}`. `false` → route straight to API Response (step 6). `true` → continue to step 4. This is the "downstream nodes must skip when `output.ok === false`" rule from the script's own header comment. On the `false` branch, step 4/5 never run, so `indexedCount` in the response resolves from a node that was skipped — see the note under the outputMapping below for why this still behaves correctly. |
| 4 | Vectorize (`vectorizeNode`) | Embed Chunks (`vectorizeNode_4`) | Two config fields: **Texts to vectorize** and **Embedding Model Name**. Bind Texts to vectorize to `{{codeNode_2.output.texts}}` (requires `string[]`). Output shape: `{ "vectors": [[...numbers...]] }` — an array of vectors, one per input text, in the same order. |
| 5 | Index (`vectorNode`) | Index Chunks (`vectorNode_5`) | Index action config fields: **Vector DB**, **Vectors**, **Metadata**, **Primary Keys (JSON)**, **Duplication Records** (`overwrite` or `skip`). Bind Vectors to `{{vectorizeNode_4.output.vectors}}` and Metadata to `{{codeNode_2.output.metadata}}` (a parallel array, one entry per text above) carrying `experimentId`, `documentId`, `strategy`, `chunkId`, `start`, `end`, `content` — this is what lets the Evaluate flow rebuild real `Chunk` objects from search-result metadata later. Primary Keys: `["documentId", "strategy", "chunkId"]`. Duplication Records: `overwrite`. `experimentId` is deliberately **not** part of the key: re-running an experiment against the same document and strategy cleanly replaces the prior vectors (same document ⇒ same chunk boundaries ⇒ idempotent upsert) instead of accumulating stale duplicates. This node's own output fields are **`recordsIndexed`**, `duplicateRecordsDeleted`, and `message` — not `indexedCount`, and there is no field that echoes back the input text count. |
| 6 | API Response (`graphqlResponseNode`) | Response (`responseNode_triggerNode_1`) | outputMapping (exact JSON below). |

**Index flow API Response `outputMapping`:**

```json
{
  "ok": "{{codeNode_2.output.ok}}",
  "indexedCount": "{{vectorNode_5.output.recordsIndexed}}",
  "issues": "{{codeNode_2.output.issues}}"
}
```

`ok` and `indexedCount` are the fields `orchestrate.ts`'s `runIndexFlow` actually reads —
it treats anything other than `ok: true` with `indexedCount > 0` as a failure and never
proceeds to the Evaluate flow for that experiment. **`indexedCount` must be bound to the
Index node's own `recordsIndexed` output field, not to `codeNode_2.output.texts.length`.**
`texts` is a Prepare Chunks field, not a Studio VectorDB node output — the Index node
never emits a field by that name, so a binding to it would leave `indexedCount` empty on
every run, and `orchestrate.ts`'s `runIndexFlow` treats an empty/non-numeric
`indexedCount` as a failure (`asFiniteNumber` returns `null` for anything that isn't a
number), making every successful index look like a failure. `issues` is extra and safe —
the app ignores unknown fields.

On the Skip Gate's `false` branch (step 3), `vectorNode_5` never runs, so
`{{vectorNode_5.output.recordsIndexed}}` resolves from a node that was skipped. Verify in
Studio what an unresolved reference like this evaluates to for your build — if it comes
through as empty/non-numeric (the expected case), `orchestrate.ts`'s
`indexedCount <= 0` check already treats that as a failure, which is exactly the
behavior wanted when chunking failed. This is a deliberate consequence of switching the
binding to `recordsIndexed`, not a new problem — the previous `texts.length` binding
worked identically here since `codeNode_2` always sets `texts: []` on failure regardless
of which branch the Skip Gate takes.

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
| 1 | API Request (`graphqlNode`) | Trigger (`triggerNode_1`) | Fields: `experimentId`, `documentId`, `documentText`, `topK`, `cases` (array of `{ id, question, evidence: [{ quote, start?, end? }], required? }`), `alignmentIssues` (optional array — a direct API caller that ran its own Index step may forward its `issues` here; `orchestrate.ts` never populates it, since it already stops before calling this flow if either Index call fails). `cases` is an array of objects, and there is no schema type for that (gotcha #2/#3) — **recommended: leave `advance_schema: ""` entirely**, the same way `kits/point-proven/flows/index-articles.ts` leaves its trigger untyped to pass an array through. The alternative — declaring `cases` as `string` and JSON-encoding it — would need a matching change in `apps/actions/orchestrate.ts`, which is out of scope here. `responeType: realtime` (gotcha #1). |
| 2 | Loop (`forLoopNode`) | Cases Loop (`forLoopNode_2`) | Iterate `{{triggerNode_1.output.cases}}`. |
| 3 | Vector Search (`searchNode`) | Search Fixed-Width | Inside the loop. Confirmed fields — see the callout below the table for the source and full type details. `searchQuery`: current item's `question`. `filters`: scope to this experiment and strategy — the confirmed JSON-encoded-string value (`experimentId` equal to the trigger's `experimentId`, `strategy` equal to the literal `"fixed-width"`) is given below the table, right after the field-type callout. `limit`: a bit more than `topK` (e.g. `10`) so the Metrics node has enough breadth to compute `firstCompleteEvidenceRank` beyond the cutoff. `certainty`: a string, not a number. `embeddingModelName` and `vectorDB`: both model/credential pickers, set in Studio's UI (gotcha #4) — both must match Flow 1's Index step (same embedding model, same Vector DB). |
| 4 | Vector Search (`searchNode`) | Search Clause-Aware | Same as step 3, but `filters`' second condition matches `strategy` equal to the literal `"clause-aware"` instead — the confirmed value is given below the table. Both searches run on **every** call — this is what lets the Metrics node compute the full baseline-vs-candidate comparison from a single call, matching `compareStrategies`, which always needs both sides. Same field list and caveats as step 3. |
| 5 | Variables (`variablesNode`) | Combine Case Results | Merge the two search nodes' hits for this loop item into one array (`entry.results`), each hit still carrying its own `metadata.strategy` so downstream code can split them back apart. Loop output: `searchResults: [{ caseId: <item.id>, results: [...] }, ...]`. |
| 6 | Code (`codeNode`) | Metrics (`codeNode_6`) | Paste `@scripts/evidence-fit-evaluate_metrics.ts` verbatim. Bind `{{triggerNode_1.output}}` and `{{forLoopNode_2.output.searchResults}}` (whole loop output via the `(x)` picker) to the script's `{{triggerNode_1.output}}` / `{{searchNode_1.output}}` placeholders — update those two ids in the pasted script, or rename your nodes to match them. Output: `{ ok, verdict, issues, baseline, candidate, recommended }`. This is the only node in the flow that computes `verdict`, and it needs no per-call `strategy` input — it always evaluates both. |
| 7 | LLM (`LLMNode`) | Explain Verdict (`llmNode_7`) | System prompt: `@prompts/evidence-fit-evaluate_llm-node_system.md`. User message: bound directly to `{{codeNode_6.output}}` (whole node output) via Studio's inline prompt editor — not externalized, since it is pure data-binding with no static instructional text of its own. Model config: `@model-configs/evidence-fit-evaluate_llm-node.ts`. |
| 8 | API Response (`graphqlResponseNode`) | Response (`responseNode_triggerNode_1`) | outputMapping (exact JSON below). **Read the callout after the JSON before wiring this node.** |

**Vector Search node — confirmed fields, closed from a real deployed export:** the
Vector Search node is listed in [Lamatic's node catalogue](https://lamatic.ai/docs/nodes),
but both of its own documentation URLs currently serve the
[VectorDB node](https://lamatic.ai/docs/nodes/data/vectordb-node) page instead. The field
names below therefore come from a working deployed export, not published documentation —
`kits/point-proven/flows/synthesize-digest.ts`, node `searchNode_244`:

```json
{
  "nodeId": "searchNode",
  "values": {
    "nodeName": "Vector Search",
    "limit": 30,
    "filters": "[]",
    "certainty": "0.5",
    "searchQuery": "{{triggerNode_1.output.query}}",
    "embeddingModelName": {}
  }
}
```

Confirmed field names: `nodeName`, `limit`, `filters`, `certainty`, `searchQuery`,
`embeddingModelName`. A seventh field, `vectorDB`, also appears (blanked to `""` on
export) in every other real `searchNode` export in this repo —
`kits/deep-search/flows/agentic-reasoning-data-source.ts` (`searchNode_278`),
`kits/embed-search/flows/embedded-search-search.ts` (`searchNode_842`,
`searchNode_145`), and `kits/multi-vector-search/flows/multi-vector-search.ts`
(`searchNode_147`, `searchNode_549`, `searchNode_795`) — so treat the node as exposing
these six confirmed fields plus `vectorDB`.

Critical type details that will break hand-written YAML:

- `filters` is a **JSON-encoded string**, not an object or array. Empty is the literal
  string `"[]"`. Every real `searchNode` `filters` value found across all four kits
  checked for this document is exactly `"[]"` — three kits set it explicitly; the three
  `searchNode`s in `multi-vector-search` omit the key entirely instead (which behaves as
  no filtering). **None of the `searchNode` exports checked populate a real filter
  condition** — but the populated syntax itself is confirmed from elsewhere in this repo;
  see the callout below the table.
- `certainty` is a **string** in every real export checked, e.g. `"0.5"`, `"0.6"`,
  `"0.85"`, `.9`, `.8` — never a bare number.
- `limit` is inconsistent across real exports and worth treating defensively: the
  `point-proven` and `embed-search` exports cited above use a plain number (`30`, `5`);
  the `deep-search` and `multi-vector-search` exports use a numeric string (`"3"`,
  `"10"`). This checklist's own source (`point-proven`) uses a plain number, so **prefer
  a plain number**, but don't be surprised if Studio also accepts a numeric string.
- `embeddingModelName` (and `vectorDB`) are model/credential pickers — see gotcha #4.
  Set both in Studio's UI, never in YAML.

**Filter syntax for `experimentId` + `strategy` — confirmed from two independent
sources.** These sources agree with each other:

- **Lamatic's own docs** for the [VectorDB node](https://lamatic.ai/docs/nodes/data/vectordb-node)
  — the page both Vector Search documentation URLs redirect to (see the callout above) —
  give this structure for a Filter action:

  ```json
  {
    "operator": "And",
    "operands": [
      {
        "path": ["topic"],
        "operator": "Equal",
        "valueText": "Topic1"
      }
    ]
  }
  ```

  Top-level `operator` is the logical combinator (`"And"` / `"Or"`); `operands` is an
  array of conditions. Each condition has `path` (an **array** naming the metadata
  field, not a bare string), `operator` (the comparison, e.g. `"Equal"`), and `valueText`
  (the value to match).

- **A real deployed export in this repo** confirms the same shape and closes two things
  the docs alone don't: `kits/embed-chat/flows/embedded-chatbot-resource-deletion.ts`,
  node `vectorNode_537` (`action: "delete"`), has a `filters` value of exactly:

  ```
  "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"title\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.title}}\"\n    }\n  ]\n}"
  ```

  `kits/embed-search/flows/embedded-search-resource-deletion.ts` carries the **identical**
  node — same node id `vectorNode_537`, same `action: "delete"`, same filter shape,
  differing only in which metadata field and value it matches (`source` bound to
  `{{forLoopNode_399.output.currentValue}}` instead of `title`). Together they confirm:

  1. `filters` is a **JSON-encoded string**, not a nested object — the pretty-printed
     JSON above is escaped into one string, exactly like `advance_schema` (gotcha #2).
  2. `valueText` accepts a `{{nodeId.output.field}}` template variable, so a filter
     value can be bound at runtime instead of hardcoded.

  Both confirmed examples come from a `vectorNode`'s delete action rather than a
  `searchNode`, but the filter shape itself — `operator`/`operands`/`path`/`valueText` —
  is exactly what Lamatic's docs describe as the VectorDB node's Filter action, which is
  the same page both Vector Search doc links resolve to (see the callout above). No
  source consulted for this document shows a populated `searchNode` filter specifically
  (see the bullet above), so this checklist treats the Vector Search node as sharing the
  VectorDB node's filter syntax on the strength of the docs, not a `searchNode`-specific
  export.

**What steps 3 and 4 must actually contain.** Both Vector Search nodes need to filter on
the current experiment *and* their own strategy — this is exactly what prevents
cross-experiment contamination: without the `experimentId` condition, a search over
`documentText` from one experiment could also match chunks indexed by an unrelated
experiment's run against the same document (same `documentId`, different
`experimentId`), since both flows share the same collection (see the paragraph above the
table). ANDing both conditions scopes a search to exactly the vectors this call's Index
step produced.

Fixed-Width search node (step 3) `filters` — the JSON-encoded string form to paste into
the field:

```
"{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"experimentId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.experimentId}}\"\n    },\n    {\n      \"path\": [\n        \"strategy\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"fixed-width\"\n    }\n  ]\n}"
```

Which decodes to (for reference — do not paste this pretty-printed form where the
escaped string above is required):

```json
{
  "operator": "And",
  "operands": [
    { "path": ["experimentId"], "operator": "Equal", "valueText": "{{triggerNode_1.output.experimentId}}" },
    { "path": ["strategy"], "operator": "Equal", "valueText": "fixed-width" }
  ]
}
```

Clause-Aware search node (step 4) `filters`: identical, with the second operand's
`valueText` set to the literal `"clause-aware"` instead of `"fixed-width"`.

Studio's own configuration panel may accept pretty-printed JSON directly in the
`filters` field and encode it into the escaped string on save (the way the Config tab's
YAML does for other JSON-string fields — see gotcha #2). If so, paste the readable
`json` block above into the panel and expect the escaped single-line string shown above
it to be what actually lands in the exported flow; don't hand-type the escaped form
unless the panel requires it.

`path` must match the metadata key names the Index flow actually writes, and it does:
`scripts/evidence-fit-index_prepare-chunks.ts`, in its glue section below the
`END VENDORED` marker, builds the `metadata` array bound to the Index node's Metadata
field with both keys present verbatim — `experimentId: experimentId` and
`strategy: ch.strategy` in the `metadata` mapping just above the script's final `output`
assignment. Both `path` values above match those keys exactly.

**Only `"Equal"` is confirmed.** Both sources above use the comparison operator
`"Equal"`; Lamatic's docs mention the logical operators `"And"` / `"Or"` generally, but
no other comparison operator is confirmed by any source consulted for this document. Do
not invent `NotEqual`, `GreaterThan`, or anything else — if a different comparison is
ever needed, check the node panel in Studio for what it actually offers.

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
