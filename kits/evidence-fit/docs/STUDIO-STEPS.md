# EvidenceFit — Studio Build Walkthrough

A linear, do-this-then-this path through building, deploying, testing and exporting both
EvidenceFit flows in Lamatic Studio, start to finish, in one sitting. It assumes you have
never built a Lamatic flow before and have never opened Studio's flow editor.

This is **not** the field-level reference — that's
[`STUDIO-BUILD.md`](./STUDIO-BUILD.md), which documents every node's exact configuration
in isolation and is the thing to re-check whenever a step below says "configure the
node." This document only tells you the *order* to do things in and what to click. For
what EvidenceFit is and how to run it once the deployed flows exist, see
[`../USAGE.md`](../USAGE.md).

Work through the phases in order. Each step has one action and a checkbox. Tick it before
moving to the next step — several later steps assume an earlier one is already done.

---

## Two decisions already made, before you start

You don't need to re-decide either of these — they're settled, and the reasons are here
so you know *why* the flow list and the build method look the way they do.

**1. Two separate flows, not one — `evidence-fit-index` and `evidence-fit-evaluate`.**
Indexing has to be fully committed to the vector store before search can read it back. If
one execution did both indexing and evaluation, a read could run before the write it
depends on has settled, which returns empty search results and produces a confident but
wrong `BLOCK` verdict — silently, with no error to tell you why. Two flows means the app
only calls Evaluate after Index has actually returned a success response for both
strategies (see `apps/actions/orchestrate.ts`).

**2. Build in Studio's visual (canvas) editor — YAML alone can never finish either
flow.** Several values Studio generates cannot be typed by hand: a Condition node's
`condition` field embeds an auto-generated edge id (a real one looks like
`"conditionNode_230-addNode_447"`); a Loop node must be paired to a `forLoopEndNode` by an
id Studio mints when you draw the connection; and every model, credential, and vector
database field is a picker whose saved value contains a Studio-minted `credentialId`
UUID. None of that is hand-authorable, so no amount of YAML finishes either flow.

The Config tab still has two honest uses: *inspecting* a flow you have already built,
and **seeding the plain nodes** (trigger, code, response) so you place fewer by hand.
Seeds for both flows live in [`studio-configs/`](./studio-configs/README.md) — applying
one is optional, and if you do, you still finish every model, credential, vector
database, Loop, Condition and Search node in the canvas editor exactly as the phases
below describe. See
[`STUDIO-BUILD.md`](./STUDIO-BUILD.md#partial-accelerator-seed-the-graph-from-the-config-tab-yaml)
for why those specific nodes can never come from YAML.

---

## Phase 0 — Project prerequisites

Do all of this before creating either flow. The node pickers you'll use in Phases 1–2 can
only offer things already attached to the project — if they're missing, those pickers
show up empty and there's nothing to select.

- [ ] **1.** Sign in to Lamatic Studio and create a new project (or open the project you
  want EvidenceFit's flows to live in).
  **Expected result:** you land on an empty project dashboard with a "Create Flow" (or
  similar) action visible.

- [ ] **2.** Attach a vector database to the project (Studio's project settings /
  integrations area — the exact label is "Vector DB" or "Vector Database").
  **Expected result:** the vector database shows as connected in project settings.

- [ ] **3.** Attach an embedding model to the project.
  **Expected result:** the embedding model shows as connected/available.

- [ ] **4.** Attach an OpenAI credential (or another chat-completion provider Studio
  supports) to the project. This kit's intended model is `gpt-4o-mini` via `openai` (see
  `model-configs/evidence-fit-evaluate_llm-node.ts`), but any small inexpensive chat model
  works — the LLM node only explains numbers it's handed, it never judges retrieval
  quality itself.
  **Expected result:** the credential shows as connected/available.

- [ ] **5.** Write down which vector database you attached in step 2.
  **Both flows must target this exact same vector database.** If Index writes to one
  database and Evaluate searches a different one, every case will silently return zero
  results — not an error, just an empty result set that reads as a confident `BLOCK`. This
  is the single most important thing to get right in this whole walkthrough.

---

## Phase 1 — Build `evidence-fit-index`

**Node order:** API Request → Code "Prepare Chunks" → Vectorize → VectorDB Index → API
Response.

A note on node IDs before you start: every ID shown below (`triggerNode_1`, `codeNode_2`,
etc.) is illustrative, chosen to match the comments already written into
`scripts/evidence-fit-index_prepare-chunks.ts`. Studio will mint its own ids (something
like `codeNode_794`) the moment you drop a node onto the canvas. Wherever a step below
says "bind to `{{codeNode_2...}}`," substitute *your* node's actual id — visible in that
node's settings panel — not the number printed here.

### 1.1 — Create the flow and the trigger

- [ ] **1.** Create a new flow named `evidence-fit-index` (matches the `steps[].id` in
  `lamatic.config.ts` — keep this exact spelling, it becomes the exported filename in
  Phase 4).
  **Expected result:** an empty canvas with a default trigger node already placed, or a
  prompt to add one.

- [ ] **2.** Add (or configure the default) trigger node as a GraphQL API trigger, named
  **API Request**.
  **Expected result:** a node on the canvas labeled "API Request."

- [ ] **3.** Open the API Request node's settings and set `responeType` to `realtime`.
  Yes, that's the field's actual (misspelled) name in Studio — do not look for
  `responseType`.
  **Expected result:** the field shows `realtime` selected.

- [ ] **4.** In the same node, find the schema field (`advance_schema`) and enter this
  exact JSON-encoded string — Studio's schema editor lets you add fields named
  `experimentId`, `documentId`, `documentText`, `strategy`, each typed `string`; behind
  the scenes it stores it as:
  ```
  "{\n  \"experimentId\": \"string\",\n  \"documentId\": \"string\",\n  \"documentText\": \"string\",\n  \"strategy\": \"string\"\n}"
  ```
  All four fields are plain strings, so this types cleanly in Studio's schema UI — you
  won't hit the "no object/array-of-object type" limitation here.
  **Expected result:** the trigger's schema panel lists all four fields as type `string`.

- [ ] **5.** Note this node's actual Studio-assigned id (shown in its settings panel).
  You'll bind to it as `{{<that-id>.output}}` in step 1.2.3.
  **Expected result:** you've written the id down somewhere you'll paste from.

### 1.2 — The Code node ("Prepare Chunks") — deliberately simple, no Skip Gate yet

`STUDIO-BUILD.md`'s reference checklist for this flow includes a Condition ("Skip Gate")
node between Code and Vectorize, to short-circuit indexing when chunk preparation fails.
**Build without it first.** It's by far the fiddliest node to configure (its `condition`
value embeds a generated edge id you can't type by hand), and
`apps/actions/orchestrate.ts` already validates every payload — including resolving every
evidence quote to a verified offset — before it ever calls this flow, so the failure
branch this gate exists for is rarely exercised in practice. This is a deliberate staged
simplification, not an omission: add the Skip Gate later, following
`STUDIO-BUILD.md`, only if you observe the Vectorize node erroring on an empty or failed
chunk result.

- [ ] **1.** Add a Code node immediately after API Request. Name it **Prepare Chunks**.
  **Expected result:** a new node on the canvas, connected from API Request.

- [ ] **2.** Open `scripts/evidence-fit-index_prepare-chunks.ts` in your editor, select
  everything, and copy it — vendored block included. It's roughly 900 lines; that length
  is expected and correct, don't trim it.
  **Expected result:** the full file contents are on your clipboard.

- [ ] **3.** Paste the entire contents into the Code node's `code` field.
  **Expected result:** the editor shows the full script, ending in the `output = { ok:
  ..., issues: ..., texts: ..., metadata: ... }` assignment.

- [ ] **4.** Find this line near the top of the pasted script:
  ```
  let trigger = {{triggerNode_1.output}};
  ```
  Replace `triggerNode_1` with your actual API Request node's id from step 1.1.5 (or, if
  you'd rather not edit the pasted script, rename your trigger node's id to
  `triggerNode_1` — Studio may or may not allow renaming an id directly; matching the
  binding to the real id is the more reliable path). Never leave a `{{ }}` reference
  unresolved anywhere, including inside comments.
  **Expected result:** `trigger` is bound to your real API Request node's whole output.

**Expected result for 1.2 overall:** the Code node's output, when the node is test-run
with sample trigger data, is an object with `ok`, `issues`, `texts` (an array of chunk
text strings), and `metadata` (a parallel array of `{experimentId, documentId, strategy,
chunkId, start, end, content}` objects).

### 1.3 — Vectorize

- [ ] **1.** Add a Vectorize node after Code. Name it **Vectorize**.
  **Expected result:** a new node, connected from Prepare Chunks.

- [ ] **2.** Set `inputText` to `{{codeNode_2.output.texts}}` (your Code node's id,
  `.output.texts` specifically). This is a deliberate departure from the general Vectorize
  pattern documented in `STUDIO-BUILD.md` (binding a whole node output) — Prepare Chunks
  emits an *object* with several fields, not a bare `string[]`, and Vectorize requires
  `string[]`. The script's own comment says exactly this: "Vectorize REQUIRES: string[].
  Bind `{{codeNode_2.output.texts}}` there." Bind the sub-path, not the whole node.
  **Expected result:** `inputText` shows the `.texts` path, not just `.output`.

- [ ] **3.** Set `embeddingModelName` using the model picker — select the embedding model
  you attached in Phase 0. The field will show as an empty `{}` until you do this; that's
  normal, not a bug — Studio fills in the real model reference (including a
  `credentialId`) once you pick.
  **Expected result:** the picker shows your chosen embedding model selected, not blank.

- [ ] **4.** Test-run this node (Studio's per-node test/run action) with sample data from
  step 1.2's output, or with any short `string[]`, and confirm it returns embedding
  vectors — one per input string. Note whether the output is a bare array or wrapped in an
  object; you'll need to know this for step 1.4.4.
  **Expected result:** the node's test output is a list of numeric vectors, same length as
  the input texts array.

### 1.4 — VectorDB Index

- [ ] **1.** Add a VectorDB node after Vectorize, action set to **Index**. Name it
  **Index**.
  **Expected result:** a new node, connected from Vectorize.

- [ ] **2.** Select the **same** vector database you attached in Phase 0 step 2 (and wrote
  down in step 5). Double-check this against what you'll pick in Phase 2 — this is the
  one field where a mismatch produces no error at all, just silent empty search results
  later.
  **Expected result:** the vector database picker shows your project's vector DB selected.

- [ ] **3.** Set these fields exactly:
  | Field | Value |
  |---|---|
  | `action` | `index` |
  | `filters` | `""` (empty string — index actions don't filter) |
  | `duplicateOperation` | `overwrite` |
  | `primaryKeys` | `["documentId", "strategy", "chunkId"]` — the composite key that makes re-indexing the same document/strategy/chunk idempotent rather than creating duplicates |
  | `metadataField` | `{{codeNode_2.output.metadata}}` |

  **Expected result:** all five fields show the values above, with `metadataField`
  pointing at your actual Code node's id.

- [ ] **4.** Set `vectorsField` to your Vectorize node's whole output — `{{vectorizeNode_3.output}}`
  (your actual Vectorize node's id). Confirm this against what you saw in step 1.3.4's
  test run: if Vectorize's output came back wrapped in an object rather than a bare array
  of vectors, bind the sub-path that holds the array instead (e.g.
  `{{vectorizeNode_3.output.vectors}}`) — Studio's own picker will show you the available
  paths. This is the one field in this flow without a verified example elsewhere in this
  repo to copy from directly, so confirm the shape empirically rather than guessing.
  **Expected result:** `vectorsField` resolves (no grey/unresolved binding) when you
  test-run the node.

### 1.5 — API Response

- [ ] **1.** Add a GraphQL Response node after VectorDB Index. Name it **API Response**.
  **Expected result:** a new node, connected from Index.

- [ ] **2.** Set `outputMapping` to bind these three fields — enter it via Studio's
  mapping editor (which stores it as a JSON-encoded string); shown here unescaped for
  readability:
  ```json
  {
    "ok": "{{codeNode_2.output.ok}}",
    "indexedCount": "{{vectorNode_4.output.recordsIndexed}}",
    "issues": "{{codeNode_2.output.issues}}"
  }
  ```
  **`indexedCount` must come from the VectorDB Index node's `recordsIndexed` output field
  — never from a code-node count like `texts.length`.** `apps/actions/orchestrate.ts`
  checks `indexedCount > 0` to decide whether indexing actually succeeded; binding a field
  the Index node never emits would make every successful index run look like a failure to
  the app, with no indication why.
  **Expected result:** `outputMapping` shows all three fields, with `indexedCount` bound
  to `recordsIndexed` specifically (not `duplicateRecordsDeleted` or `message`, the other
  two fields the Index action emits).

- [ ] **3.** Connect the edges API Request → Prepare Chunks → Vectorize → Index → API
  Response, if Studio hasn't already auto-connected them as you added nodes in sequence.
  **Expected result:** one unbroken chain of arrows from trigger to response, no
  disconnected nodes.

**Phase 1 expected result:** five connected nodes, no grey/unresolved `{{ }}` bindings
anywhere (check every node, not just the ones you just touched), ready to deploy.

---

## Phase 2 — Build `evidence-fit-evaluate`

**Node order:** API Request → Loop (over cases) → [inside the loop: Vector Search
(fixed-width) → Vector Search (clause-aware) → Variables (combine)] → Code "Metrics" →
LLM "Explain Verdict" → API Response.

### 2.1 — Create the flow and the trigger

- [ ] **1.** Create a new flow named `evidence-fit-evaluate` (again, must match the
  `steps[].id` in `lamatic.config.ts` exactly).
  **Expected result:** an empty canvas with a trigger node.

- [ ] **2.** Configure the trigger as a GraphQL API trigger named **API Request**, with
  `responeType` set to `realtime` (same misspelled field, same value as Flow 1).
  **Expected result:** the field shows `realtime`.

- [ ] **3.** Set `advance_schema` to exactly this:

  ```json
  {
    "experimentId": "string",
    "documentId": "string",
    "documentText": "string",
    "topK": "int",
    "cases": "array"
  }
  ```

  Studio **refuses to save the flow with an empty schema** — it raises "Unconfigured
  GraphQL Schema: You have to configure graphql trigger schema before saving the flow."
  An earlier version of this document said to leave the schema empty, on the theory that
  Studio has no type for `cases` (an array of objects: `{id, question, evidence[],
  required?}`). That was wrong on both counts. `"array"` and `"object"` are real,
  accepted types — confirmed in merged exports:
  `kits/atlas-agent/flows/atlas-deliver-execution-context.ts` declares
  `"approvedTask": "object", "requirements": "array"`, and
  `kits/sre-command-center/flows/data-ingestion.ts` declares an array of objects as
  `"metadata": [{}]`.

  `"array"` passes the array straight through, so `apps/actions/orchestrate.ts` needs no
  change — it already sends `cases` as a raw array and `topK` as a number. Do **not**
  declare `cases` as `string`; that would require JSON-encoding it in the app.
  **Expected result:** the flow saves without the Unconfigured GraphQL Schema error, and
  `{{triggerNode_1.output.cases}}` resolves in the Loop node.

### 2.2 — The Loop

- [ ] **1.** Add a Loop node after API Request. Name it **Loop**.
  **Expected result:** Studio prompts you to also place a paired "Loop End" node — accept
  this; a Loop node cannot exist without its `forLoopEndNode` counterpart.

- [ ] **2.** Set `iterateOver` to `list`, and `iteratorValue` to
  `{{triggerNode_1.output.cases}}` (your actual trigger node's id).
  **Expected result:** the Loop node shows it will iterate over the trigger's `cases`
  array.

- [ ] **3.** Leave `initialValue`, `endValue`, and `increment` at whatever Studio defaults
  to when you select "iterate over list" and pick the array above (commonly `"0"`, `"10"`,
  `"1"`) — these three fields govern range-style iteration and Studio manages them for you
  once `iterateOver` is `list`. Don't hand-type different values here.
  **Expected result:** no validation error on the Loop node.

- [ ] **4.** Confirm `connectedTo` shows your Loop End node's id (Studio should have set
  this automatically when it paired the two nodes in step 1). This is the same paired
  relationship used in the real Loop node in
  `kits/point-proven/flows/index-articles.ts` (`forLoopNode_370` ↔ `forLoopEndNode_301`)
  — open that file side-by-side if you want to see a working Loop/Loop-End pair in a real
  export.
  **Expected result:** `connectedTo` is populated, not blank.

- [ ] **5.** Note: inside the loop body, the current case is available as
  `{{forLoopNode_2.output.currentValue.<field>}}` (your Loop node's id) — e.g.
  `{{forLoopNode_2.output.currentValue.id}}` for the current case's id,
  `.currentValue.question` for its question text. This `currentValue` path is the same
  one used for the current item in `index-articles.ts`'s loop
  (`{{forLoopNode_370.output.currentValue.metadata.title}}`, etc.). You'll use this in the
  next two sub-sections.
  **Expected result:** you understand where "the current case" comes from for the nodes
  you're about to add — nothing to click yet.

### 2.3 — Two Vector Search nodes, inside the loop

Both nodes below must sit **inside** the Loop's body (between Loop and Loop End on the
canvas) — Studio's canvas shows the loop as a boundary you drop nodes into. Both run on
*every* iteration, which is what lets one search per case score both strategies at once.

- [ ] **1.** Add a Vector Search node inside the loop, immediately after Loop. Name it
  **Search — Fixed-Width**.
  **Expected result:** the node appears inside the loop boundary on the canvas.

- [ ] **2.** Set `searchQuery` to `{{forLoopNode_2.output.currentValue.question}}` (your
  Loop node's id) — the current case's question text.
  **Expected result:** `searchQuery` resolves to a string, not a grey/unresolved binding.

- [ ] **3.** Set `filters` to this exact JSON-encoded string (shown unescaped below;
  Studio stores it escaped, the same way `advance_schema` and `outputMapping` are). This
  shape — `{operator: "And", operands: [{path, operator: "Equal", valueText}]}` — is
  verified from Lamatic's own docs and from a real deployed export in this repo,
  `kits/embed-chat/flows/embedded-chatbot-resource-deletion.ts` (its `vectorNode_537` and
  `vectorNode_493` nodes use this identical `filters` shape). `Equal` is the only
  comparison operator confirmed anywhere in this repo — don't reach for something like
  `>=` or `contains` without verifying it the same way first.
  ```json
  {
    "operator": "And",
    "operands": [
      { "path": ["experimentId"], "operator": "Equal", "valueText": "{{triggerNode_1.output.experimentId}}" },
      { "path": ["strategy"], "operator": "Equal", "valueText": "fixed-width" }
    ]
  }
  ```
  Both `path` values match metadata keys `evidence-fit-index_prepare-chunks.ts` actually
  writes onto every indexed vector — `experimentId` and `strategy` (see step 1.4.3's
  `metadataField`) — so this filter matches real indexed data, not a guessed field name.
  **Expected result:** the filters field holds this JSON (escaped), with both `path`
  values spelled exactly `experimentId` and `strategy`.

- [ ] **4.** Set `certainty` to `"0.5"` (a string, matching the documented default) and
  `limit` to `20`. Set `embeddingModelName` via the picker to the same embedding model
  used in Flow 1's Vectorize node — **searches must use the same embedding model that
  indexed the vectors**, or similarity scores are meaningless.
  **Expected result:** all three fields are set; `embeddingModelName` shows your model
  selected, not the empty `{}` placeholder.

- [ ] **5.** Add a second Vector Search node, also inside the loop, after the first one.
  Name it **Search — Clause-Aware**.
  **Expected result:** a second node inside the loop boundary.

- [ ] **6.** Configure it identically to steps 2–4 above, with one difference: the
  `strategy` operand's `valueText` is the literal string `clause-aware` instead of
  `fixed-width`:
  ```json
  {
    "operator": "And",
    "operands": [
      { "path": ["experimentId"], "operator": "Equal", "valueText": "{{triggerNode_1.output.experimentId}}" },
      { "path": ["strategy"], "operator": "Equal", "valueText": "clause-aware" }
    ]
  }
  ```
  **Expected result:** two Vector Search nodes inside the loop, each filtering on its own
  strategy and on the current `experimentId` — this is what prevents one experiment's
  results from contaminating another's.

### 2.4 — Variables node (combine), still inside the loop

- [ ] **1.** Add a Variables node inside the loop, after both Vector Search nodes. Name it
  **Combine Search Results**.
  **Expected result:** a new node inside the loop boundary, connected from both Search
  nodes.

- [ ] **2.** Add a `caseId` mapping entry: `{"type": "string", "value":
  "{{forLoopNode_2.output.currentValue.id}}"}`.
  **Expected result:** the mapping shows `caseId` bound to the current loop item's id.

- [ ] **3.** Add a `results` mapping entry that combines both Vector Search nodes' outputs
  into **one single array** mixing hits from both strategies (each hit still carries its
  own `metadata.strategy`, so nothing is lost by mixing them — the Metrics code node
  splits them back apart itself, by reading each hit's own `metadata.strategy`). Use
  Studio's value editor for this field to merge/combine the two Vector Search nodes'
  outputs. **Test-run this node** after wiring it and confirm `results` comes back as one
  flat array containing items from both searches, not two separate arrays and not just
  one strategy's hits. This one field is the single least-standardized part of this whole
  build — nothing else in this repo's verified examples shows two node outputs merged
  into one array inside a Variables node — so verify it empirically before moving on
  rather than trusting the wiring blind.
  **Expected result:** a test run of this node shows `results` as one array whose items'
  `metadata.strategy` values include both `"fixed-width"` and `"clause-aware"`.

### 2.5 — Loop End

- [ ] **1.** Open the Loop End node Studio created in step 2.2.1. Confirm `connectedTo`
  points back to your Loop node's id.
  **Expected result:** `connectedTo` matches your Loop node's id from section 2.2.

- [ ] **2.** Set `outputAccumulator` to snapshot each iteration as a one-element array
  entry, so that across all iterations the results concatenate into one array with one
  entry per case — mirroring the accumulator pattern in
  `kits/point-proven/flows/index-articles.ts` (`forLoopEndNode_301`'s
  `outputAccumulator`, later read back via `.output.accumulated.<field>`). Enter (via
  Studio's editor, shown unescaped here):
  ```json
  {
    "results": [
      {
        "caseId": "{{variablesNode_5.output.caseId}}",
        "results": "{{variablesNode_5.output.results}}"
      }
    ]
  }
  ```
  (your actual Variables node's id in place of `variablesNode_5`).
  **Expected result:** no validation error on the Loop End node.

- [ ] **3.** After wiring section 2.6 below, come back and test-run the whole loop, then
  confirm `{{forLoopEndNode_6.output.accumulated.results}}` (your Loop End node's id)
  comes back as an array with exactly one entry per case in your test payload — not one
  entry per case-per-strategy (2×), and not one flattened list of chunks.
  **Expected result:** the accumulated array's length equals your test payload's `cases`
  array length.

### 2.6 — Code node ("Metrics"), outside the loop

- [ ] **1.** Add a Code node **after** Loop End (outside the loop boundary — this node
  runs once, after every case has been searched, not once per case). Name it **Metrics**.
  **Expected result:** a new node on the canvas, outside the loop, connected from Loop
  End.

- [ ] **2.** Open `scripts/evidence-fit-evaluate_metrics.ts`, select all, copy, and paste
  the entire contents into this node's `code` field.
  **Expected result:** the editor shows the full script.

- [ ] **3.** Find and update these two lines near the top of the pasted script:
  ```
  let trigger = {{triggerNode_1.output}};
  let searchOut = {{searchNode_1.output}};
  ```
  Replace `triggerNode_1` with your real API Request node's id. Replace
  `searchNode_1` with your Loop End node's accumulated-results path:
  `{{forLoopEndNode_6.output.accumulated.results}}` — **not** a raw Vector Search node's
  id. The placeholder name in the script is illustrative ("your per-case search node");
  what actually belongs there is whatever produces the final array of `{caseId, results}`
  entries, which in this build is the Loop End node's accumulator, not either Search node
  directly. Binding either Search node's output here directly would give the script only
  one strategy's hits at a time, and — because its per-case assignment overwrites rather
  than merges — the second Search node's entry for a given case would silently wipe out
  the first strategy's already-recorded ranking for that same case. The Loop End
  accumulator is what avoids this: it hands the script one combined `results` array per
  case (built in section 2.4), so both strategies survive in a single assignment.
  **Expected result:** neither line contains an unresolved `{{ }}` reference, and
  `searchOut` binds to the Loop End node's accumulated array.

**Expected result for 2.6 overall:** test-running this node with realistic accumulated
search data returns an object with `ok`, `verdict`, `issues`, `baseline`, `candidate`,
`recommended` — the exact shape `apps/actions/orchestrate.ts`'s `parseComparison()`
validates.

### 2.7 — LLM node ("Explain Verdict")

- [ ] **1.** Add an LLM node after Metrics. Name it **Explain Verdict**.
  **Expected result:** a new node, connected from Metrics.

- [ ] **2.** Add a `system` prompt entry. Paste the entire contents of
  `prompts/evidence-fit-evaluate_llm-node_system.md` as its content.
  **Expected result:** the system prompt field shows the full instructions, starting "You
  explain EvidenceFit's already-computed retrieval-experiment results..."

- [ ] **3.** Add a `user` prompt entry whose content hands the node the computed
  comparison — for example: "Here is the computed comparison for this experiment:
  `{{codeNode_7.output}}` — explain this result following your instructions." (your
  actual Metrics code node's id). Prefer binding the whole node output here, same as
  elsewhere in this build.
  **Expected result:** the user prompt resolves the Metrics node's output, not a grey
  binding.

- [ ] **4.** Set `generativeModelName` via the picker to the OpenAI credential you
  attached in Phase 0 — `gpt-4o-mini` is this kit's intended model (see
  `model-configs/evidence-fit-evaluate_llm-node.ts`), though any small chat model works.
  **Expected result:** the picker shows your chosen model, not the empty placeholder.

### 2.8 — API Response

> **CRITICAL — read this before wiring `outputMapping`.** `verdict` and every metric
> field must be wired **only** from the Metrics code node's output. The LLM node's output
> goes into a separate `explanation` field, and nowhere else. If the LLM node's output can
> reach `verdict` through any path in this mapping, the determinism guarantee this whole
> kit is built around collapses — a prompt-injected instruction inside the document text
> could talk the model into asserting a different verdict than the one code actually
> computed, and there would be no way to tell from the API response alone. If you catch
> yourself wiring `verdict` (or any metric) from `llmNode`, stop, undo it, and rebuild —
> a flow with this wired wrong must not be exported.

- [ ] **1.** Add a GraphQL Response node after both Metrics and Explain Verdict. Name it
  **API Response**.
  **Expected result:** a new node connected from both upstream nodes.

- [ ] **2.** Set `outputMapping` (shown unescaped for readability; Studio stores it as a
  JSON-encoded string):
  ```json
  {
    "verdict": "{{codeNode_7.output.verdict}}",
    "baseline": "{{codeNode_7.output.baseline}}",
    "candidate": "{{codeNode_7.output.candidate}}",
    "recommended": "{{codeNode_7.output.recommended}}",
    "ok": "{{codeNode_7.output.ok}}",
    "issues": "{{codeNode_7.output.issues}}",
    "explanation": "{{llmNode_8.output}}"
  }
  ```
  (your actual Metrics and Explain Verdict node ids). Confirm `verdict`, `baseline`,
  `candidate`, and `recommended` all read from your **Metrics code node** — never from the
  LLM node — and that `explanation` is the *only* field reading from the LLM node.
  **Expected result:** `outputMapping` shows exactly this shape; a visual scan confirms no
  `llmNode` reference appears anywhere except in the `explanation` line.

**Phase 2 expected result:** nine connected nodes (API Request, Loop, two Vector Search
nodes and a Variables node inside the loop, Loop End, Metrics, Explain Verdict, API
Response), no grey/unresolved bindings, `verdict` traceable to the Metrics node only.

---

## Phase 3 — Deploy and test each flow in Studio

- [ ] **1.** Deploy `evidence-fit-index` (Studio's Deploy action for the flow) and wait
  for the flow's status badge to actually read **Deployed** (green) before testing it. A
  flow left in **Draft** returns errors from test/API calls that look identical to a
  network failure, which wastes time debugging the wrong thing.
  **Expected result:** the flow's status badge is green / reads "Deployed."

- [ ] **2.** Test `evidence-fit-index` with `strategy: "fixed-width"`, using Studio's test
  panel and this payload (the document text is the kit's own verified sample contract,
  from `apps/lib/fixtures/sample-contract.ts`):
  ```json
  {
    "experimentId": "sample-msa-001",
    "documentId": "sample-msa",
    "documentText": "MASTER SERVICES AGREEMENT\n\n1. Term. This Agreement commences on the Effective Date and continues for an initial period of three (3) years, and shall renew automatically for successive one (1) year periods unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term.\n\n2. Fees and Payment. Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue interest at the lesser of one and one-half percent (1.5%) per month or the maximum rate permitted by law. Provider may suspend the Services if any undisputed invoice remains unpaid for more than sixty (60) days after written notice of non-payment has been delivered to Customer.\n\n3. Limitation of Liability. Except for breaches of confidentiality, indemnification obligations, and Customer's payment obligations, neither party's aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer to Provider during the twelve (12) months immediately preceding the event giving rise to the claim.\n\n4. Termination for Convenience. Customer may terminate this Agreement for convenience upon sixty (60) days prior written notice to Provider, provided that Customer shall remain responsible for all fees accrued through the effective date of termination and shall not be entitled to any refund of prepaid fees.\n\n5. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.",
    "strategy": "fixed-width"
  }
  ```
  **Expected result:** the response has `ok: true` and `indexedCount` greater than 0.

- [ ] **3.** Test `evidence-fit-index` again with the same `documentText`, same
  `experimentId`/`documentId`, but `strategy: "clause-aware"`.
  **Expected result:** `ok: true`, `indexedCount` greater than 0 again. Both strategies
  are now indexed for `sample-msa-001` in the same vector database.

- [ ] **4.** Deploy `evidence-fit-evaluate` the same way and wait for its **Deployed**
  badge.
  **Expected result:** green "Deployed" badge.

- [ ] **5.** Test `evidence-fit-evaluate` with this payload — two of the sample fixture's
  five acceptance cases, including the one specifically constructed to sever under
  fixed-width chunking (`liability-cap`, whose second quote straddles the default
  500/50-character chunk boundary):
  ```json
  {
    "experimentId": "sample-msa-001",
    "documentId": "sample-msa",
    "documentText": "MASTER SERVICES AGREEMENT\n\n1. Term. This Agreement commences on the Effective Date and continues for an initial period of three (3) years, and shall renew automatically for successive one (1) year periods unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term.\n\n2. Fees and Payment. Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late amounts accrue interest at the lesser of one and one-half percent (1.5%) per month or the maximum rate permitted by law. Provider may suspend the Services if any undisputed invoice remains unpaid for more than sixty (60) days after written notice of non-payment has been delivered to Customer.\n\n3. Limitation of Liability. Except for breaches of confidentiality, indemnification obligations, and Customer's payment obligations, neither party's aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer to Provider during the twelve (12) months immediately preceding the event giving rise to the claim.\n\n4. Termination for Convenience. Customer may terminate this Agreement for convenience upon sixty (60) days prior written notice to Provider, provided that Customer shall remain responsible for all fees accrued through the effective date of termination and shall not be entitled to any refund of prepaid fees.\n\n5. Governing Law. This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of laws principles.",
    "topK": 5,
    "cases": [
      {
        "id": "renewal-notice",
        "question": "How much notice is required to prevent automatic renewal?",
        "evidence": [
          {
            "quote": "unless either party gives written notice of non-renewal at least ninety (90) days before the end of the then-current term"
          }
        ]
      },
      {
        "id": "liability-cap",
        "question": "What is the cap on aggregate liability, and what is carved out of it?",
        "evidence": [
          {
            "quote": "Except for breaches of confidentiality, indemnification obligations, and Customer's payment obligations"
          },
          {
            "quote": "neither party's aggregate liability arising out of or related to this Agreement shall exceed the total fees paid or payable by Customer to Provider during the twelve (12) months immediately preceding the event giving rise to the claim"
          }
        ]
      }
    ]
  }
  ```
  **Expected result:** a response with `ok: true`, `baseline.strategy: "fixed-width"`,
  `candidate.strategy: "clause-aware"`, a non-empty `explanation` string, and — per the
  fixture's own documented behavior in `USAGE.md` §3 — the baseline strategy showing at
  least one boundary-severed span on `liability-cap` while the candidate shows zero, with
  an overall `verdict` that reflects whichever strategy `recommended` names.

---

## Phase 4 — Export

- [ ] **1.** Open `evidence-fit-index`'s three-dot menu and choose **Export**.
  **Expected result:** Studio downloads or shows the flow's exported TypeScript.

- [ ] **2.** Save that export as `kits/evidence-fit/flows/evidence-fit-index.ts`. The
  filename must exactly match the `steps[].id` value `evidence-fit-index` in
  `lamatic.config.ts` — this is how the app and CI locate the flow.
  **Expected result:** the file exists at that exact path.

- [ ] **3.** Repeat for `evidence-fit-evaluate`: export, save as
  `kits/evidence-fit/flows/evidence-fit-evaluate.ts`.
  **Expected result:** both flow files exist under `kits/evidence-fit/flows/`.

- [ ] **4.** Do **not** hand-edit either exported file afterward — not even to "fix" the
  `responeType` misspelling, which is correct as exported. `.github/workflows/validate-pr-studio.yml`
  posts each flow's contents back to Lamatic for validation on every PR; a hand-altered
  export can fail that check even if the edit looks harmless, because the validator
  compares against what Studio itself would produce.
  **Expected result:** both files are exactly what Studio exported, untouched.

---

## Phase 5 — Wire environment and hand back

- [ ] **1.** From `kits/evidence-fit/apps`, copy the example env file:
  ```bash
  cd kits/evidence-fit/apps
  cp .env.example .env.local
  ```
  **Expected result:** `.env.local` exists alongside `.env.example`.

- [ ] **2.** Fill in all five values in `.env.local`:
  | Variable | Where it comes from |
  |---|---|
  | `LAMATIC_API_KEY` | Studio → Settings → API Keys |
  | `LAMATIC_PROJECT_ID` | Studio → Settings → API Keys (same page) |
  | `LAMATIC_API_URL` | Studio → Settings → API Keys (your project's endpoint URL) |
  | `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID` | `evidence-fit-index` flow → Details Panel → Flow ID |
  | `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID` | `evidence-fit-evaluate` flow → Details Panel → Flow ID |
  **Expected result:** all five variables have real values, none left as the
  `your_..._here` placeholders.

- [ ] **3.** Never commit `.env.local`. Confirm it's covered by `.gitignore` (it should
  already be, via the standard Next.js `.env*.local` ignore pattern) before running any
  `git add`.
  **Expected result:** `git status` does not list `.env.local` as untracked-to-be-added.

- [ ] **4.** Report back that both flows are deployed and exported, with their Flow IDs,
  so the exports can be committed and the deployed path (`npm run dev` in
  `kits/evidence-fit/apps` with `.env.local` populated, running the sample experiment from
  `USAGE.md` §3) can be exercised end to end.
  **Expected result:** the two exported flow files, plus a working `.env.local`, are ready
  for that verification pass.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `unconfigured graphql type` | `responseType` was used instead of the misspelled `responeType`, or `advance_schema` is not a JSON-encoded string | Rename the field to `responeType`; re-enter `advance_schema` through Studio's schema editor rather than pasting raw text |
| `Unconfigured Text Generate — Fill required field Generative Model Name` | A stray LLM node left over from Lamatic's own docs/YAML example is still on the canvas | `evidence-fit-index` has **no** LLM node at all — delete any LLM node you find in that flow |
| Grey / non-resolving `{{...}}` bindings | The node id inside a pasted script or mapping doesn't match your actual node's id | Re-check every `{{...}}` reference in the Code nodes and mappings against the real ids shown in each node's settings panel; prefer binding a whole node output over a nested path when you're not certain of the exact shape |
| Vector Search returns nothing for every case | The two flows point at different vector databases, or `evidence-fit-index` hasn't been run yet for this `experimentId`/`strategy` combination | Confirm both flows' VectorDB fields point at the same database (Phase 0 step 5); re-run Phase 3 steps 2–3 for the `experimentId` you're testing |
| `Search — Fixed-Width` and `Search — Clause-Aware` return overlapping/wrong-strategy results | The `filters` JSON was mistyped, incomplete, or the `strategy` operand's `valueText` was left the same on both nodes | Re-check `filters` on each node against section 2.3 step 3/6 field by field — confirm both `path` values (`experimentId`, `strategy`), that `operator` is `Equal` on both operands, and that the two nodes' `strategy` operand differ (`fixed-width` vs `clause-aware`) |
| Metrics code node's `baseline`/`candidate` come back `null` with `ok: false` | The accumulated search results didn't reach the Metrics node in the `{caseId, results}` shape it expects — often because the Variables node's `results` field only merged one strategy, or the Loop End's `outputAccumulator` wasn't wired to the Variables node | Test-run the Loop End node in isolation (section 2.5 step 3) and confirm `accumulated.results` has one entry per case, each with a `results` array containing both `"fixed-width"` and `"clause-aware"` items before touching the Metrics node again |
| A deployed test looks fine but the app's Evaluate call fails with "did not return a valid comparison shape" | The API Response `outputMapping` is missing one of `verdict`/`baseline`/`candidate`/`recommended`, or one is misspelled | Re-check `outputMapping` in section 2.8 field by field against `apps/actions/orchestrate.ts`'s `parseComparison()` |

---

## Final checklist

- [ ] Both flows target the same vector database (Phase 0 step 5, confirmed again in
  Phase 1.4.2).
- [ ] `evidence-fit-index` has exactly the five nodes in Phase 1's order, no Condition
  node (unless you deliberately added the Skip Gate later per Phase 1.2's note).
- [ ] `evidence-fit-index`'s API Response binds `indexedCount` from the VectorDB Index
  node's `recordsIndexed` — verified, not assumed.
- [ ] `evidence-fit-evaluate` has both Vector Search nodes inside the loop, each filtered
  by `experimentId` and its own `strategy`, using the verified `{operator: "And",
  operands: [{path, operator: "Equal", valueText}]}` shape.
- [ ] `evidence-fit-evaluate`'s API Response binds `verdict`, `baseline`, `candidate`, and
  `recommended` **only** from the Metrics code node — `explanation` is the only field
  reading from the LLM node. You checked this by eye, not just by memory.
- [ ] Both flows are deployed (green badge), not left as drafts.
- [ ] All three Phase 3 test calls returned the expected results.
- [ ] Both flows are exported, byte-for-byte as Studio produced them, to
  `kits/evidence-fit/flows/evidence-fit-index.ts` and
  `kits/evidence-fit/flows/evidence-fit-evaluate.ts`.
- [ ] `apps/.env.local` exists, has all five variables filled in, and is not staged in
  git.
- [ ] You've reported back with both Flow IDs so the exports can be committed and the
  deployed path exercised end to end.
