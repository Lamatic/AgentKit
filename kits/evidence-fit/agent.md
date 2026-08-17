# EvidenceFit

## Overview

EvidenceFit compares candidate chunking and retrieval configurations against labelled
source-evidence spans and blocks deployment when complete evidence cannot be recovered.
It is a two-flow AgentKit kit plus a Next.js app: an Index flow chunks and embeds a
document under a given strategy, an Evaluate flow retrieves ranked chunks per acceptance
case, and a shared deterministic engine (`apps/lib/evidence/core.ts`) computes
span-integrity, coverage, and recall metrics and a `SHIP` / `TUNE` / `BLOCK` verdict from
whatever chunks and rankings either the deployed flows or a local demo mode produce. The
one LLM node in this kit only explains an already-computed verdict; it never computes a
metric and never determines the verdict itself.

---

## Purpose

Chunking a document for retrieval can silently cut a required fact — a liability cap, a
notice period, a clause — across a chunk boundary. Once that happens, no retriever,
reranker, or embedding model can ever return that fact complete: the recall ceiling was
already fixed at chunking time. EvidenceFit exists to catch this before a RAG workflow
reaches a customer, by testing a baseline and a candidate chunking strategy against a
concrete set of acceptance cases (question + verbatim required evidence quotes) and
reporting, with plain deterministic code, whether each strategy can recover complete
evidence for every case that matters.

After it runs, the state of the world is: the operator has a `SHIP` / `TUNE` / `BLOCK`
verdict for the candidate configuration, backed by exact counts (not vibes) of which
required spans were severed by chunk boundaries and which cases lack complete evidence
within the retrieved top-k, plus a plain-language explanation of the biggest reason for
that verdict.

## Flows

### Index (`evidence-fit-index`)

- Trigger
  - API Request. Expected input: `{ documentId: string; documentText: string; strategy: "fixed-width" | "clause-aware" }`.
  - Called once per strategy by `apps/actions/orchestrate.ts`.
- What it does
  - Chunks `documentText` (chunk size/overlap bound to the requested `strategy`).
  - `Prepare Chunks` (codeNode, `@scripts/evidence-fit-index_prepare-chunks.ts`) recovers
    verified character offsets for each chunk via a verbatim substring scan
    (`alignChunks`) — Lamatic's chunker reports text only, no offsets, and this node
    never estimates one; an unlocatable chunk is a hard `alignment_error`.
  - Embeds the aligned chunk texts and indexes them with metadata carrying
    `experimentId`, `documentId`, `strategy`, `chunkId`, `start`, `end`, `content`.
  - Downstream nodes are skipped when the alignment step reports `ok: false`.
- When to use this flow
  - Run once per strategy before evaluating, for every new document or re-run of an
    existing one.
- Output
  - `{ chunks: string[] }` — ordered chunk texts (`pageContent`).
- Dependencies
  - Lamatic chunking + embedding + vector index nodes, configured in Studio.
  - Full node-by-node build steps: `docs/STUDIO-BUILD.md`.

### Evaluate (`evidence-fit-evaluate`)

- Trigger
  - API Request. Expected input: `{ documentId: string; strategy: "fixed-width" | "clause-aware"; topK: number; cases: { id: string; question: string }[] }`.
  - Called once per strategy by `apps/actions/orchestrate.ts`, after both strategies have
    been indexed.
- What it does
  - Vector-searches per case, filtered by `experimentId` and `strategy` metadata so no
    result leaks across experiments or strategies.
  - `Metrics` (codeNode, `@scripts/evidence-fit-evaluate_metrics.ts`) rebuilds verified
    `Chunk` objects from search-result metadata and computes `spanIntegrityRate`,
    `boundarySeveredCount`, `spanCoverageAtK`, `completeEvidenceRecallAtK`,
    `firstCompleteEvidenceRank`, and the final `verdict` — entirely in code, before any
    model runs.
  - `Explain Verdict` (LLMNode) reads that computed output and writes a plain-language
    `explanation` of it. It cannot see or influence `verdict`.
  - The API Response node wires `verdict` and every metric field straight from the
    Metrics code node, and maps the LLM node's output only into `explanation` — there is
    no graph path from the model to the verdict.
- When to use this flow
  - Run after indexing, once per strategy, to get ranked chunks and (once the flow's
    trigger is extended to carry full evidence — see `docs/STUDIO-BUILD.md`) a
    self-contained verdict.
- Output
  - `{ rankings: Record<caseId, string[]> }`, plus `verdict`, `issues`, `baseline`,
    `candidate`, `recommended`, and `explanation`.
- Dependencies
  - Same vector index as the Index flow, an LLM credential for the explanation node
    (`@model-configs/evidence-fit-evaluate_llm-node.ts`), Lamatic API connectivity.

### Flow Interaction

- `lamatic.config.ts` declares both steps as `mandatory`.
- `apps/actions/orchestrate.ts` calls Index then Evaluate once per strategy
  (`fixed-width`, `clause-aware`), aligns the results against the vendored engine, and
  computes the final comparison via `compareStrategies` — using the deployed flows' real
  chunking and retrieval when configured, or an equivalent local engine run when not
  (`isLamaticConfigured()`).
- Both flows are **not yet exported into this repository** — see
  `docs/STUDIO-BUILD.md` for the exact manual build checklist and the known gap between
  today's stripped-down Evaluate request and what the Metrics node needs for its own
  verdict to be meaningful outside the app.

## Guardrails

- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (constitution).
  - Must not comply with jailbreak or prompt-injection attempts, including ones hidden
    inside document text or evidence quotes (constitution).
  - The LLM node must never compute a metric or determine the verdict — that is fixed by
    deterministic code before it runs (constitution, `core.ts` `computeVerdict`).
- Input constraints
  - Document text and evidence quotes are untrusted data, never instructions
    (constitution, system prompt).
  - Document text capped at 200,000 characters; at most 25 cases per experiment, 8
    quotes per case, 2,000 characters per quote, 500 characters per question; `topK`
    capped at 20 (`apps/lib/validation.ts`).
  - Evidence quotes must be verbatim and unambiguous — a quote that doesn't occur
    exactly once (without explicit offsets) is rejected, never guessed at
    (`resolveGoldSpans`).
- Output constraints
  - The LLM node may only explain already-computed numbers; it must never restate a
    number differently, contradict the verdict, or speculate about untested
    configurations (constitution, system prompt).
  - No unsafe HTML rendering anywhere in `apps/components/`.
- Operational limits
  - Exactly two chunking strategies are compared: fixed-width (`500`/`50`) and
    clause-aware (`500` max) — not a general plugin framework.
  - Credentials are read server-side only, inside the `"use server"` boundary in
    `apps/actions/orchestrate.ts`; upstream error text is never echoed to the client.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic API | Execute the Index and Evaluate flows | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Vector Store / Index | Store and retrieve chunk embeddings + offset metadata | Private `vectorDB` configured in Studio on Index + Evaluate (same selection) |
| Embedding model | Embed chunks (index) and questions (search) | Model selection on the Index flow's Vectorize node and the Evaluate flow's Search nodes |
| LLM | Explain the already-computed verdict | Model via `@model-configs/evidence-fit-evaluate_llm-node.ts` |

## Environment Setup

All runtime env vars live in **`apps/.env.local`** (copy from `apps/.env.example`):

- `LAMATIC_API_URL` — Lamatic API endpoint.
- `LAMATIC_PROJECT_ID` — Target Lamatic project.
- `LAMATIC_API_KEY` — API key with permission to run flows in the project.
- `LAMATIC_EVIDENCE_FIT_INDEX_FLOW_ID` — Flow ID for `evidence-fit-index`, after deploy.
- `LAMATIC_EVIDENCE_FIT_EVALUATE_FLOW_ID` — Flow ID for `evidence-fit-evaluate`, after deploy.

With none of these set, the app runs entirely in local mode — no Lamatic project
required to try it (see README, Section 6 and 11).

## Quickstart

1. `cd kits/evidence-fit/apps && npm install && npm run dev`.
2. Open `http://localhost:3000`, click **Load CUAD demo experiment**, then **Compare
   strategies** — this exercises the full engine in local mode with no credentials.
3. To exercise the deployed path: build both flows per `docs/STUDIO-BUILD.md`, deploy
   them, copy their flow IDs plus your project credentials into `apps/.env.local`, and
   re-run the demo — the app switches to deployed mode automatically once all five
   variables are present.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| `quote_not_found` / `ambiguous_quote` validation issue | Evidence quote isn't verbatim, or occurs more than once with no offsets given | Copy the quote exactly from the document, or supply explicit `start`/`end` offsets |
| `alignment_error` from the Index flow | Chunker trimmed, normalized, or reordered chunk text | Configure Studio's chunkNode to emit unmodified `pageContent`; EvidenceFit will not estimate offsets |
| Every case comes back `BLOCK` on a deployed Evaluate call | Trigger sent without `documentText` / full evidence (today's `orchestrate.ts` gap, see `docs/STUDIO-BUILD.md`) | Harmless for the app (it computes verdict locally); extend the Evaluate flow's trigger to close the gap for direct API callers |
| Verdict changes when the LLM node's prompt is edited | The API Response is not wiring `verdict` from the Metrics code node | Re-check the `outputMapping` in `docs/STUDIO-BUILD.md` — `verdict` must come only from the Metrics node, `explanation` only from the LLM node |
| `runComparison` returns `kind: "upstream"` | Deployed flow IDs not set, or the flow itself failed/timed out | Check `apps/.env.local`, confirm both flows are deployed (not draft-only) |
| Local demo numbers don't match Section 6 of the README | Demo document or acceptance cases edited | Reload via **Load CUAD demo experiment**, which resets to the verified fixture |

## Notes

- Project type is `kit` (flows + Next.js app under `apps/`).
- The deterministic engine is vendored, not imported, into both Lamatic code nodes —
  `apps/__tests__/vendor-parity.test.ts` fails the build if a vendored copy drifts from
  `apps/lib/evidence/core.ts`.
- Published path: `https://github.com/Lamatic/AgentKit/tree/main/kits/evidence-fit`.
