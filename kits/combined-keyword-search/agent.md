# Combined Keyword Search

## Overview
Combined Keyword Search provides BM25-style keyword search for websites by querying multiple backends and returning a single merged result set. It is implemented as a **single-flow** Lamatic AgentKit pipeline that fans out searches in parallel and then consolidates them before responding. The primary invoker is a website or application search UI (via a search bar trigger) that needs fast, deterministic keyword retrieval rather than conversational generation. It integrates with one or more full-text / vector-database-backed keyword search providers via AgentKit `fullTextSearchNode` connectors.

---

## Purpose
The goal of this agent system is to let users search site content using keyword relevance (BM25) while hiding the complexity of querying multiple indexes or databases. After it runs, the caller receives one coherent set of results that reflect the best matches across all configured data sources, instead of having to run separate searches and reconcile duplicates client-side.

Operationally, the flow performs concurrent searches against several configured stores, normalizes each store’s results into a shared structure, and merges them into a single ranked list. This improves resilience (one backend can fail without fully breaking search), scalability (parallelism reduces end-to-end latency), and maintainability (a single place to adjust ranking, deduplication, and result shaping).

This template is designed to be embedded behind a web search bar or internal site search endpoint. It focuses on retrieval outcomes (documents/snippets/URLs with scores) rather than generating long-form answers.

## Flows

### Combined Keyword Search

- **Flow ID / Step:** `combined-keyword-search`

#### Trigger
- **Invocation:** User-initiated search from a UI component (`SearchBar` via `searchTriggerNode`).
- **Expected input shape (logical):**
  - `query` — the user’s keyword query string
  - `topK` (optional) — maximum number of results to return
  - `filters` (optional) — structured constraints such as site section, language, tags, or tenant
- **Notes:** The exact trigger payload is defined by the project’s trigger configuration under `triggers/`. If you expose this flow via an API, map incoming request fields to the trigger’s `query` and optional controls.

#### What it does
1. `SearchBar` (`searchTriggerNode`) receives the search request and extracts the keyword query and any optional parameters (e.g., `topK`, `filters`).
2. `Combine Results` (`codeNode`) prepares the data model used for downstream branching and merging. This typically includes:
   - Normalizing the incoming query
   - Establishing a shared result schema (e.g., `id`, `title`, `snippet`, `url`, `score`, `source`)
   - Initializing an accumulator for multi-backend results
3. `Branching` (`branchNode`) fans out execution into multiple parallel branches so searches can run concurrently against different backends.
4. A sequence of internal aggregation/merge steps (`addNode_262`, `addNode_688`, `addNode_420`, `addNode_222`, `addNode_475`, `addNode_165`, `addNode_135`) progressively combines outputs from each branch into a single collection. Functionally, these nodes are responsible for:
   - Collecting each backend’s hits
   - Concatenating and/or deduplicating results
   - Applying source-aware weighting or tie-break rules (as configured)
5. Three keyword-search executors run (`Keyword Search` / `fullTextSearchNode`, `fullTextSearchNode_874` / `fullTextSearchNode`, `Keyword Search` / `fullTextSearchNode`). Each `fullTextSearchNode` performs a BM25-like keyword search against its configured index/store and returns a list of matches with scores and metadata.
6. `Search Response` (`searchResponseNode`) formats the consolidated results into the final response object returned to the caller.

#### When to use this flow
- When you need keyword relevance (BM25) rather than semantic Q&A.
- When the content you search is distributed across multiple indexes or databases and you want one unified result list.
- When low latency matters and parallel search across sources is preferable to sequential querying.

#### Output
- **Success response (logical):**
  - `results` — array of result items, typically including:
    - `id` (or document key)
    - `title`
    - `snippet` (optional highlight/excerpt)
    - `url` or `path`
    - `score` (BM25 / backend score, possibly normalized)
    - `source` (which backend/index produced the hit)
  - `meta` (optional) — timing, backend health, number of sources searched, partial-failure indicators
- **Ordering:** Results should be returned in descending relevance after merge/deduplication.

#### Dependencies
- `fullTextSearchNode` integrations (one per backend) configured to point at the desired keyword-search-capable stores or services.
- Credentials/configuration for each backend (service endpoints, API keys, index names), provided via Lamatic connection settings and/or environment variables.
- Project configuration: `lamatic.config.ts` (template metadata and step registration).

### Flow Interaction
This template contains a single runnable flow (`combined-keyword-search`). There is no cross-flow chaining. Internally, the flow uses branching to execute multiple `fullTextSearchNode` searches in parallel and then merges those outputs before responding.

## Guardrails
- **Prohibited tasks**
  - (Inferred) Must not generate or execute arbitrary code; this system is for retrieval and result aggregation only.
  - (Inferred) Must not fabricate search results that are not present in the underlying indexes.
- **Input constraints**
  - (Inferred) `query` must be a non-empty string; excessively long queries should be rejected or truncated server-side to protect backends.
  - (Inferred) `topK`, if provided, must be a reasonable integer bound (e.g., 1–50) to prevent abuse.
  - (Inferred) `filters`, if provided, must match the configured schema supported by your search backends.
- **Output constraints**
  - Must not return raw credentials, connection strings, or internal configuration.
  - (Inferred) Must not return sensitive content outside the caller’s authorization scope; apply tenant/ACL filters at query time.
  - (Inferred) Avoid returning PII unless the indexed corpus is explicitly intended to expose it.
- **Operational limits**
  - (Inferred) Parallel searches increase backend load; enforce rate limits and request timeouts.
  - (Inferred) If one backend is unavailable, the flow should degrade gracefully (return partial results with a `meta` warning) rather than failing the entire request.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| `searchTriggerNode` | Entry point to receive user keyword queries (e.g., from a website search bar or API) | Trigger binding / endpoint configuration (project `triggers/`) |
| `fullTextSearchNode` (x3) | Execute BM25-style keyword search against each configured backend/index in parallel | Backend endpoint/index + auth (e.g., `*_API_KEY`, `*_ENDPOINT`, `*_INDEX_NAME`) |
| `codeNode` | Normalize inputs and define merge logic / shared result schema | None (uses flow code/config) |
| `branchNode` | Fan out execution to parallel search branches | None |
| `addNode` (multiple) | Aggregate, deduplicate, and merge per-backend results | None |
| `searchResponseNode` | Shape and return the final response payload | None |

## Environment Setup
- `LAMATIC_PROJECT_NAME` — optional deployment identifier; used by Lamatic tooling (all flows)
- `LAMATIC_ENV` — environment selector (e.g., `dev`, `staging`, `prod`) for configuration resolution (all flows)
- `SEARCH_BACKEND_1_ENDPOINT` — endpoint/host for backend 1 used by a `fullTextSearchNode` (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_1_API_KEY` — credential for backend 1 (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_1_INDEX` — index/collection name for backend 1 (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_2_ENDPOINT` — endpoint/host for backend 2 used by `fullTextSearchNode_874` (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_2_API_KEY` — credential for backend 2 (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_2_INDEX` — index/collection name for backend 2 (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_3_ENDPOINT` — endpoint/host for backend 3 used by the third `fullTextSearchNode` (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_3_API_KEY` — credential for backend 3 (flow: `combined-keyword-search`)
- `SEARCH_BACKEND_3_INDEX` — index/collection name for backend 3 (flow: `combined-keyword-search`)
- `lamatic.config.ts` — project metadata and step registration (repo root)

## Quickstart
1. Deploy or configure three keyword-search backends (or fewer, adjusting the flow) and note each backend’s endpoint, credentials, and index name.
2. Set the environment variables (or Lamatic connection configs) for each backend used by the `fullTextSearchNode` instances.
3. In Lamatic Studio, deploy the template from `https://studio.lamatic.ai/template/combined-keyword-search` or run the kit locally from the repository.
4. Invoke the trigger with a search request. If your deployment exposes a GraphQL endpoint, the call shape typically looks like:
   - Mutation (placeholder):
     - `mutation Run($input: JSON!) { runFlow(flow: "combined-keyword-search", input: $input) { output } }`
   - Variables (placeholder):
     - `{ "input": { "query": "refund policy", "topK": 10, "filters": { "section": "docs" } } }`
5. Verify the response includes a unified `results` array with `source` fields indicating which backend contributed each hit.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Empty `results` for valid queries | Index not populated, wrong index name, or filters too restrictive | Confirm backend index contains documents; verify `*_INDEX` values; relax or validate `filters` |
| One backend’s results never appear | Misconfigured `fullTextSearchNode` connection or missing credentials | Check the node’s connection settings; verify endpoint/API key; confirm network access |
| Slow responses / timeouts | Backends slow, too many parallel branches, or `topK` too high | Add timeouts; reduce `topK`; optimize backend; consider caching frequent queries |
| Duplicate results across sources | No deduplication key or inconsistent document IDs | Ensure a stable `id`/`url` is present; update merge logic in `codeNode`/`addNode` steps |
| 5xx errors from search providers | Rate limiting or provider outage | Add retries/backoff; enforce caller rate limits; enable partial-result behavior |

## Notes
- Template metadata is defined in `lamatic.config.ts` (name: `Combined Keyword Search`, version: `1.0.0`, author: Naitik Kapadia).
- Source repository: `https://github.com/Lamatic/AgentKit/tree/main/kits/combined-keyword-search`.