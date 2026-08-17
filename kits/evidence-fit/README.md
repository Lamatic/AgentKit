# EvidenceFit

> RAG teams cannot tell whether chunking destroys required source evidence before generation. EvidenceFit compares candidate chunking and retrieval configurations against labelled source-evidence spans and blocks deployment when complete evidence cannot be recovered.

EvidenceFit is **not** a RAG evaluator, an "AI quality platform," or a flow evaluator. It
does not judge generated answers, and it makes no claim about faithfulness, hallucination,
or production RAG quality in general. It answers exactly one question, with plain
deterministic code, not a model: *given this document and these acceptance cases, does
this chunking configuration let complete evidence be retrieved intact?*

---

## 1. Who this is for, and the workflow

This kit is for an **Applied AI Engineer or solutions engineer** who is about to hand a
customer's RAG workflow to production and needs a concrete, repeatable answer to "will
changing the chunking strategy break retrieval for the clauses/facts we're contractually
on the hook for?" — not a vibe check.

The workflow:

1. Take the source document (a contract, a policy, a spec — whatever the customer's
   agents must answer questions from) and write down the **acceptance cases**: the
   questions the system must be able to answer, each with the exact verbatim quote(s)
   from the document that constitute complete evidence for it.
2. Run EvidenceFit. It chunks the document two ways — the current baseline and a
   candidate — indexes both, retrieves per question, and computes whether each
   required case's complete evidence survives chunking and comes back within the top-k
   results.
3. Get a deterministic verdict: **SHIP**, **TUNE**, or **BLOCK** (Section 6). Ship the
   candidate, tune retrieval, or go fix the chunking before this ever reaches a
   customer.

---

## 2. Why source-span preservation matters

A retriever can only return what a chunk boundary left intact. If a required fact — a
liability cap, a notice period, a renewal clause — straddles the seam between two chunks,
no chunk in the index contains it, and therefore **no ranking, reranking, or embedding
model, however good, can ever return it complete.** The retriever's recall ceiling was
already decided at chunking time, before a single vector was searched.

This is the failure EvidenceFit is built to catch before it reaches production: not "is
our retriever good," but "did we already make evidence unrecoverable before retrieval
even had a chance."

---

## 3. Architecture and the two flow contracts

EvidenceFit is a **kit**: two Lamatic flows plus a Next.js app (`apps/`). The flows are
**not yet exported into this repository** — they must be built by hand in Lamatic Studio
following `docs/STUDIO-BUILD.md`, then exported to `flows/evidence-fit-index.ts` and
`flows/evidence-fit-evaluate.ts`. Until then, the app runs entirely in **local mode**
(Section 7), which needs no Lamatic project at all.

```text
documentText, cases[], strategy  →  Index flow     →  vector index (both strategies, one collection)
documentId, cases[], strategy    →  Evaluate flow   →  per-case ranked chunks
                                                          │
                              same deterministic engine (apps/lib/evidence/core.ts)
                                                          │
                                    spanIntegrityRate · boundarySeveredCount
                                    spanCoverageAtK · completeEvidenceRecallAtK
                                    firstCompleteEvidenceRank · verdict
```

**Index flow** (`evidence-fit-index`, `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID`) — called once
per strategy:

```
request:  { documentId: string; documentText: string; strategy: "fixed-width" | "clause-aware" }
response: { chunks: string[] }   // ordered chunk texts (pageContent)
```

**Evaluate flow** (`evidence-fit-evaluate`, `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID`) —
called once per strategy:

```
request:  { documentId: string; strategy: "fixed-width" | "clause-aware"; topK: number;
            cases: { id: string; question: string }[] }
response: { rankings: Record<caseId, string[]> }
```

Lamatic's `chunkNode` reports chunk text only, with no character offsets, so the Index
flow recovers verified offsets itself (`alignChunks` — a verbatim substring scan against
the source document; a chunk that cannot be re-located exactly is an `alignment_error`,
never an estimated offset). Both strategies are indexed into the **same** vector
collection, distinguished by `metadata.strategy`, so every search is filtered by both
`experimentId` and `strategy` to prevent cross-experiment contamination. Full detail,
including the exact node list and API Response `outputMapping` for both flows, is in
[`docs/STUDIO-BUILD.md`](./docs/STUDIO-BUILD.md).

The Next.js app (`apps/`) orchestrates both flows when they're deployed, or falls back to
running the same engine locally when they're not — see `apps/actions/orchestrate.ts`.

---

## 4. Metrics, in plain language

All definitions live in `apps/lib/evidence/core.ts` and are vendored verbatim into both
Lamatic code nodes under `scripts/` (a parity test fails the build if a copy ever
drifts). Every interval is half-open `[start, end)`; every rate carries its integer
numerator and denominator, never a bare float.

- **`spanIntegrityRate`** — the share of required evidence spans that land wholly inside
  at least one chunk, checked *before* retrieval. A span no single chunk fully contains
  has been cut by a chunk boundary and can never be retrieved intact, no matter how good
  search is. This is the measurement the whole product exists to make.
- **`boundarySeveredCount`** — the raw count of spans that failed that check. Any
  positive count on a required case is a hard blocker (Section 6).
- **`spanCoverageAtK`** — the share of a case's unique gold characters covered by the
  union of the top-k retrieved chunks. Overlapping chunks and overlapping gold spans are
  each counted once, so padding the index with redundant chunks can't inflate the score.
- **`completeEvidenceRecallAtK`** — the share of *required* acceptance cases whose
  complete evidence is present somewhere within the top-k retrieved chunks. This is the
  **primary metric for comparing strategies** (see below).
- **`firstCompleteEvidenceRank`** — the first 1-based rank at which a case's complete
  evidence has been fully recovered, or `null` if it never is within the chunks
  considered. This tells you how much headroom a passing case actually has — rank 1 and
  rank `k` both "pass," but they are not equally safe.

### Why not Precision@k?

Raw Precision@k is **deliberately not** the metric EvidenceFit uses to compare chunking
strategies. Precision@k's denominator is "how many of the top-k chunks are relevant" —
but *what counts as a relevant chunk changes* every time chunk boundaries change:
different chunking produces a different number and shape of chunks touching the same
gold span, so the denominator shifts strategy to strategy. Comparing two Precision@k
numbers across strategies is comparing two different rulers. `completeEvidenceRecallAtK`
sidesteps this: its denominator is the fixed count of required acceptance cases, which
does not change when chunking changes, so it is the metric that is actually meaningful
to compare across strategies.

---

## 5. Deterministic verdict rules

```
BLOCK  if any required evidence span is boundary-severed, or any input/alignment is invalid
TUNE   if every required span is intact but a required case lacks complete evidence within top-k
SHIP   otherwise
```

Precedence is strict: `BLOCK > TUNE > SHIP`. An experiment whose own inputs cannot be
trusted (an unresolvable quote, a failed offset alignment) is `BLOCK`, never scored as a
retrieval failure.

**The LLM has no graph path to the verdict.** In the deployed Evaluate flow, the API
Response node wires `verdict` — and every metric field — directly from the metrics code
node's output. The LLM node's output is mapped into a separate `explanation` field only.
There is no wire from the model to `verdict`, so nothing the model is shown — including a
prompt-injection attempt hidden inside the document text or an evidence quote — can
change the accept/reject decision an operator or API caller sees. See
`computeVerdict`'s doc comment in `apps/lib/evidence/core.ts` and the wiring table in
`docs/STUDIO-BUILD.md`.

---

## 6. CUAD demo — verified numbers

The bundled demo fixture (`apps/lib/fixtures/cuad-sample.ts`) is a 1,581-character
generic Master Services Agreement, written for this demo in the style of the public CUAD
corpus (Contract Understanding Atticus Dataset, CC BY 4.0) — no real customer or employer
material. Running it through the engine produces:

| | boundary-severed | span integrity | verdict |
|---|---|---|---|
| baseline — fixed-width, 500 chars / 50 overlap | 1 | 5/6 | **BLOCK** |
| candidate — clause-aware | 0 | 6/6 | **SHIP** |

The severed span is the liability-cap clause, which straddles the seam between the
baseline's chunk `[450, 950)` and chunk `[900, 1400)`. Under the baseline it needs two
chunks to reconstruct (`firstCompleteEvidenceRank = 2`); the clause-aware candidate
recovers it in a single chunk, at rank 1.

These numbers describe this one document and this one set of six acceptance cases — see
Section 10 before treating them as a general claim about either strategy.

To run it yourself: `cd apps && npm install && npm run dev`, open
`http://localhost:3000`, click **Load CUAD demo experiment**, then **Compare
strategies**. No Lamatic project or credentials required — see Section 7.

---

## 7. Comparison with adjacent AgentKit kits

| Existing kit | What it evaluates | How EvidenceFit differs |
|---|---|---|
| `flowbench` | Final flow output similarity and latency | EvidenceFit measures source-span preservation and retrieval completeness |
| `llm-eval-harness` | LLM outputs using an LLM judge | EvidenceFit makes no model-based correctness judgment |
| `flow-launch-auditor` | Static launch-readiness review | EvidenceFit executes chunking and retrieval experiments against labelled evidence |
| `hybrid-rrf-search` | Search and reranking implementation | EvidenceFit compares configurations and issues a deterministic acceptance verdict |
| `point-proven` | Citation-backed synthesis | EvidenceFit checks whether complete required evidence survived chunking and was retrieved |

---

## 8. Security and privacy

- **Credentials are server-side only.** `LAMATIC_API_KEY`, `LAMATIC_PROJECT_ID`, and
  `LAMATIC_API_URL` are read directly from `process.env` inside `apps/lib/lamatic-client.ts`,
  which is only ever imported from the `"use server"` boundary in
  `apps/actions/orchestrate.ts`. None are read with Next.js's client-exposed `NEXT_PUBLIC_`
  prefix, and none are ever interpolated into an error string returned to the browser —
  upstream failures are classified into generic, actionable messages
  (`upstreamMessage` in `orchestrate.ts`) precisely so raw transport errors, which can
  echo request details or credentials, never reach the client.
- **Payloads are bounded server-side** before any Lamatic call is made
  (`apps/lib/validation.ts`): document text is capped at 200,000 characters, at most 25
  cases per experiment, at most 8 quotes per case, 2,000 characters per quote, 500
  characters per question, and `topK` is capped at 20 — so a single request cannot
  become an unbounded embedding bill or an unbounded loop.
- **Document text is treated as untrusted data**, never as instructions — both by the
  deterministic engine (which only ever slices and compares it, never executes it) and
  by the constitution and system prompt governing the one LLM node in this kit, which is
  explicitly told to treat document text and evidence quotes as inert data to describe,
  never as commands (`constitutions/default.md`,
  `prompts/evidence-fit-evaluate_llm-node_system.md`).
- **No unsafe HTML rendering.** The app renders document text, quotes, and metrics as
  plain React text content throughout `apps/components/`; nothing in this kit uses
  `dangerouslySetInnerHTML` or otherwise injects raw HTML/markdown from the document or
  from model output into the DOM.

---

## 9. Limitations — read before trusting a result

- **One document, one case set.** The CUAD demo numbers in Section 6 describe one
  document and six labelled acceptance cases. This is not a statistically significant
  benchmark, and no significance is claimed for it or for any other single experiment
  you run.
- **The offline local demo's ranking is an upper bound, not a retrieval-quality claim.**
  With no Lamatic project configured, chunks are ranked locally by raw character overlap
  with the gold span (`localRank` in `core.ts`) — a deliberate best case that isolates
  the chunking question from retrieval quality. It is **not** a claim about semantic
  retrieval quality. Only the deployed path, with a real embedding model and vector
  search, exercises actual retrieval.
- **Evidence quotes must be verbatim.** A quote must occur exactly once in the document,
  or come with explicit offsets that `documentText.slice(start, end)` matches exactly.
  Ambiguous quotes (multiple occurrences, no offsets given) and quotes that cannot be
  found are rejected outright — EvidenceFit never guesses which occurrence you meant.
- **Exactly two fixed strategies in v1.** EvidenceFit compares a fixed-width baseline
  (`FIXED_WIDTH_CONFIG`: 500 chars / 50 overlap) against a clause-aware candidate
  (`CLAUSE_CONFIG`: 500 char max), both defined as constants in `core.ts`. It is not a
  general chunking-plugin framework — adding a third strategy is a code change, not a
  configuration option.
- **Retrieval layer only.** EvidenceFit evaluates whether evidence survives chunking and
  comes back from retrieval. It does not evaluate, and makes no claim about, what a
  downstream generator does with that evidence once retrieved.

---

## 10. Local setup

```bash
cd kits/evidence-fit/apps
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. With no `LAMATIC_*` variables set (or with `apps/.env.local`
left as-is), the app runs in **local mode**: everything — chunking, ranking, metrics, the
verdict — runs in this process via `apps/lib/evidence/core.ts`. No Lamatic project, no
vector database, no LLM credential is required to try it. Click **Load CUAD demo
experiment**, then **Compare strategies**, to reproduce Section 6.

## Lamatic Studio setup

1. Build both flows by hand following [`docs/STUDIO-BUILD.md`](./docs/STUDIO-BUILD.md) —
   the exact node list, `@reference` files, and API Response `outputMapping` for each.
2. Deploy both flows and copy their flow IDs from Studio's details panel.
3. Set `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID`, `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID`,
   `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, and `LAMATIC_API_KEY` in `apps/.env.local`
   (see `apps/.env.example`).
4. Re-run the CUAD demo — the app switches to **deployed mode** automatically once all
   five variables are present (`isLamaticConfigured()` in `apps/lib/lamatic-client.ts`),
   now exercising your real chunker, embedding model, and vector search instead of the
   local stand-in.

## Deployment

Click the deploy link in `lamatic.config.ts` (`links.deploy`), or manually:

```bash
# Vercel, with the app as the project root
root directory: kits/evidence-fit/apps
env: LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID, LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID,
     LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY
```

---

## 11. Reviewer path (under three minutes)

No Lamatic account needed — this exercises local mode end to end.

```bash
cd kits/evidence-fit/apps
npm install
npm run dev
```

1. Open `http://localhost:3000`.
2. Click **Load CUAD demo experiment** (pre-fills the document and all six acceptance
   cases).
3. Click **Compare strategies**.
4. Confirm: baseline (fixed-width) shows `1` boundary-severed span and verdict
   **BLOCK**; candidate (clause-aware) shows `0` boundary-severed spans and verdict
   **SHIP** — matching Section 6 exactly. Expand the boundary inspector to see the
   liability-cap clause straddling the baseline's chunk seam.

To confirm the numbers are computed, not hard-coded, edit the liability-cap clause's
evidence quote in the case editor so it no longer matches the document text verbatim and
re-run — you should see a `quote_not_found` validation issue instead of a verdict.

---

## Files

| Path | Role |
|---|---|
| `lamatic.config.ts` | Kit metadata and step wiring |
| `docs/STUDIO-BUILD.md` | Manual, node-by-node Lamatic Studio build checklist for both flows |
| `scripts/evidence-fit-index_prepare-chunks.ts` | Index flow's offset-alignment code node (vendors `core.ts`) |
| `scripts/evidence-fit-evaluate_metrics.ts` | Evaluate flow's metrics/verdict code node (vendors `core.ts`) |
| `prompts/evidence-fit-evaluate_llm-node_system.md` | System prompt for the sole LLM node — explains, never decides |
| `model-configs/evidence-fit-evaluate_llm-node.ts` | Model selection for that node |
| `constitutions/default.md` | Guardrails: untrusted data, no model-computed verdict, no speculation |
| `agent.md` | Agent identity and operational reference |
| `apps/` | Next.js app — `apps/lib/evidence/core.ts` (the engine), `apps/actions/orchestrate.ts` (local/deployed orchestration), `apps/.env.example` → copy to `apps/.env.local` |

---

*Contribution type: `kit` (flows + `apps/`).*
