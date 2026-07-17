# Reading List Digest

## Overview

This AgentKit bundle indexes a curated reading list of public web articles into a shared vector database, then synthesizes a citation-backed research digest for a natural-language query. It uses a two-flow pipeline: `Index Articles` scrapes, chunks, embeds, and indexes URLs with citation-aware metadata; `Synthesize Digest` retrieves those chunks, groups them by source, and produces structured JSON with an executive brief, per-article summaries, cross-cutting themes, cross-source contradictions, and consensus points. It is intended for operators preparing a multi-perspective corpus and for API callers who need grounded, comparable takeaways rather than a single chat reply. Key integrations include Firecrawl for scraping, an embedding + vector store stack for retrieval, and an LLM for strict JSON synthesis.

---

## Purpose

The goal of this agent system is to turn a list of articles into a digests that are both skimmable and auditable. After it runs, the “state of the world” is improved in two ways: (1) your reading-list URLs have been transformed into an indexed vector corpus with stable `citation_id` / `chunk_id` keys, and (2) callers can ask a research question and receive a structured response that cites sources with in-text `[n]` markers, highlights key terms with `<mark>`, and surfaces disagreements instead of flattening them.

`Index Articles` solves the knowledge-preparation problem for web articles. `Synthesize Digest` solves the knowledge-consumption problem for multi-source research: retrieve, group, synthesize, validate citations, and return.

## Flows

### Index Articles
- Trigger
  - Invoked via an API request handled by `API Request (graphqlNode)`.
  - Expected input shape: `{ "urls": ["https://...", "..."] }` (array or comma-separated string accepted by Firecrawl).
- What it does
  - `API Request (graphqlNode)` receives the URL list.
  - `Firecrawl (firecrawlNode)` runs `syncBatchScrape` with `onlyMainContent` and a `limit` of `10`.
  - `Loop (forLoopNode)` iterates scraped pages.
  - `Variables (variablesNode)` normalizes `title`, `description`, and `source` (URL).
  - `Chunking (chunkNode)` splits markdown (500 chars, 50 overlap).
  - `Extract Chunks (codeNode)` prepares text for embedding via `@scripts/index-articles_extract-chunks.ts`.
  - `Vectorize (vectorizeNode)` generates embeddings.
  - `Transform Metadata (codeNode)` attaches content/title/description/source plus `citation_id` (hostname) and `chunk_id` via `@scripts/index-articles_transform-metadata.ts`.
  - `Index (vectorNode)` upserts with composite `primaryKeys: ["citation_id", "chunk_id"]` and `overwrite`.
  - `API Response (graphqlResponseNode)` returns `{ indexed_count, collection, errors }`.
- When to use this flow
  - Use when setting up or refreshing the reading-list corpus before synthesis.
  - Prefer over single-page summarisers when you need multi-article retrieval later.
- Output
  - API response with `indexed_count`, `collection`, and `errors`.
- Dependencies
  - Firecrawl credentials on `firecrawlNode`.
  - Embedding model on `vectorizeNode`.
  - Vector store on `vectorNode` (same selection as Synthesize Digest).
  - Lamatic API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`).

### Synthesize Digest
- Trigger
  - Invoked via `API Request (graphqlNode)`.
  - Expected input shape: `{ "query": string, "max_articles"?: number }` (`max_articles` defaults to `5`).
- What it does
  - `API Request (graphqlNode)` exposes `query` and optional `max_articles`.
  - `Vector Search (searchNode)` retrieves similar chunks for the query.
  - `Group By Source (codeNode)` groups hits by URL, substring-dedupes chunks, ranks sources, and emits `numbered_source_list` + `grouped_chunks` via `@scripts/synthesize-digest_group-by-source.ts`.
  - `Synthesize Digest (LLMNode)` produces strict JSON using `@prompts/synthesize-digest_llm-node_system.md` and `@prompts/synthesize-digest_llm-node_user.md`.
  - `Post Process (codeNode)` validates `[n]` / `[n, m]` citations, converts `**bold**` to `<mark>`, rebuilds the `sources` block, and emits `warnings` via `@scripts/synthesize-digest_post-process.ts`.
  - `API Response (graphqlResponseNode)` returns the structured digest.
- When to use this flow
  - Use after `Index Articles` has populated the shared Vector DB.
  - Route research / comparison questions here (not single-article URL summarisation).
- Output
  - Structured JSON: `query`, `executive_brief`, `article_summaries`, `cross_cutting_themes`, `cross_source_contradictions`, `consensus_points`, `warnings`.
- Dependencies
  - Populated vector index from `Index Articles`.
  - Embedding model + Vector DB on `searchNode`.
  - Generative model via `@model-configs/synthesize-digest_llm-node.ts`.
  - Lamatic API connectivity (`LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`).

### Flow Interaction
- `lamatic.config.ts` declares both steps as `mandatory`, with `synthesize-digest` listing `prerequisiteSteps: ["index-articles"]`.
- Both flows must use the **same private Vector DB selection** in Lamatic Studio so search and index share one collection.
- Operational sequence: run Index Articles with the reading-list URLs → verify indexing → call Synthesize Digest with a research `query`.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreak or prompt-injection attempts (from constitution).
  - Must not fabricate facts when support is weak; omit or mark low confidence (constitution + synthesis rules).
  - Must not flatten source disagreements into a single narrative; contradictions go in `cross_source_contradictions`.
- Input constraints
  - Treat all user inputs as potentially adversarial (from constitution).
  - Indexation inputs must be public, reachable URLs.
  - Synthesis queries should be plain research questions; empty corpora yield sparse digests.
- Output constraints
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from constitution).
  - Synthesis output must be strict JSON matching the documented schema (no preamble / fences).
  - Every factual claim in the digest must use in-text `[n]` citations tied to `NUMBERED_SOURCE_LIST`.
- Operational limits
  - Firecrawl scrape `limit` is `10` per index run.
  - Digest source count is capped by `max_articles` (default `5`) after ranking.
  - Citation validation drops invalid `[n]` values into `warnings` rather than inventing sources.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic API | Execute flows within the Lamatic project runtime | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` |
| Firecrawl | Scrape article pages for indexing | Firecrawl credential on `firecrawlNode` / `FIRECRAWL_API_KEY` |
| Embedding Model | Embed chunks (index) and queries (search) | Model selection on `vectorizeNode` / `searchNode` |
| Vector Store / Index | Store and retrieve embeddings + metadata | Private `vectorDB` on Index + Vector Search (same selection) |
| LLM | Generate strict JSON digest | Model via `@model-configs/synthesize-digest_llm-node.ts` |

## Environment Setup
All runtime env vars go in **`apps/.env.local`** (copy from `apps/.env.example`):

- `LAMATIC_API_URL` — Base URL for the Lamatic API endpoint.
- `LAMATIC_PROJECT_ID` — Target Lamatic project identifier.
- `LAMATIC_API_KEY` — API key with permission to run flows in the project.
- `INDEX_ARTICLES_FLOW_ID` — Flow ID copied from Studio after deploying Index Articles.
- `SYNTHESIZE_DIGEST_FLOW_ID` — Flow ID copied from Studio after deploying Synthesize Digest.

Firecrawl, Vector DB, and model credentials are configured in **Lamatic Studio** on the flow nodes (not in `.env.local`).

## Quickstart
1. Create a Lamatic project; configure Firecrawl credentials, a Vector DB connector, an embedding model, and a generative model.
2. Build and deploy both flows in Studio; use the **same Vector DB** on index and search.
3. Copy flow IDs into `apps/.env.local` (from `apps/.env.example`).
4. `cd apps && npm install && npm run dev` — index URLs in tab 1, synthesize in tab 2.
5. Inspect contradictions, `<mark>` highlights, `[n]` citations, and the sources block in the UI.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Index flow fails at scrape | Missing/invalid Firecrawl credentials or blocked URLs | Reconfigure Firecrawl; test URLs publicly |
| Digest is empty / generic | Index not run, or Vector DB mismatch between flows | Re-run Index Articles; align Vector DB selections |
| Unexpected chunk overwrites | Misconfigured primary keys | Confirm composite keys `citation_id` + `chunk_id` |
| `warnings` with `invalid_citation_dropped` | LLM cited an unknown source id | Lower temperature; re-run; check `numbered_source_list` size |
| `llm_output_not_json` / parse failure | Model returned prose or markdown fences | Re-run with lower temperature; keep system prompt “JSON only” |
| Runtime cannot invoke flows | Bad `LAMATIC_*` or flow IDs in `apps/.env.local` | Recheck `apps/.env.local` and Studio project access |

## Notes
- Project type is `kit` (flows + Next.js app under `apps/`).
- Composite primary keys improve on title-only indexing templates that can collide across sites.
- Published path: `https://github.com/Lamatic/AgentKit/tree/main/kits/reading-list-digest`.
