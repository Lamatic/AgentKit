# Multi Vector Search

## Overview
This AgentKit template solves the problem of performing fast, relevant search across content that is split across multiple vector databases, without forcing the caller to query each store separately. It uses a single runnable Lamatic AgentKit flow that fans out vector searches in parallel, then consolidates results into one response suitable for direct use in a website search experience. The primary invoker is a web UI or backend service that submits a user search query and expects aggregated retrieval results. Key integrations are one or more vector database/search backends accessed via `searchNode` “Vector Search” nodes, orchestrated by branching and result-combination logic.

## Purpose
The goal of this agent system is to make website (or application) search feel unified even when embeddings and documents live in different vector indexes or vendors. After it runs, a user’s single query yields one coherent set of results that can be rendered immediately in a search UI, instead of fragmented lists from separate sources.

Operationally, the flow provides a repeatable pattern for “multi-retriever” search: accept a query, dispatch it to multiple vector searches concurrently, and merge the outputs into a consolidated payload. This improves recall (more sources searched) while keeping latency manageable through parallelism.

Because this project is packaged as an AgentKit template, its broader purpose is also instructional and reusable: teams can start from this flow and swap in their own vector stores, ranking logic, and UI integration while keeping the same high-level architecture.

## Flows

### Multi Vector Search

- **Flow identifier:** `multi-vector-search`
- **Runnable type:** Template (single flow)

#### Trigger
- **Invocation:** Website search bar / UI-driven trigger via the `SearchBar` (`searchTriggerNode`).
- **Expected input shape (logical):**
  - `query` — the user’s search string.
  - Optional (implementation-dependent): filters (e.g., `namespace`, `tags`), top-k/limit, or other retrieval parameters.

Because the raw flow schema is not provided here, the exact GraphQL field names exposed by the trigger are not enumerated; however, the trigger is designed around a typical “search bar” interaction: a single query in, results out.

#### What it does
1. **`SearchBar` (`searchTriggerNode`)** receives the end-user query from the caller (typically a website UI) and initiates the pipeline.
2. **`Combine Results` (`codeNode`)** prepares the aggregation strategy for downstream results. Functionally, this node establishes how multiple vector-search outputs will be merged (e.g., concatenation, scoring normalization, de-duplication, or source-aware grouping).
3. **`Branching` (`branchNode`)** fans out the execution path so multiple searches can run in parallel rather than sequentially, reducing end-to-end latency.
4. **`addNode_*` (`addNode`) sequence (multiple nodes)** enriches or stages data required by each branch. In practice these nodes commonly:
   - Attach per-source configuration (e.g., index name, collection, namespace)
   - Set branch-specific parameters (e.g., `topK`, metadata filters)
   - Map the shared `query` into the shape expected by each `searchNode`
5. **`Vector Search` (`searchNode`) x3** executes vector similarity search against three configured vector backends or indexes. Each node returns a list of matches (documents/chunks) with similarity scores and associated metadata.
6. **`Search Response` (`searchResponseNode`)** consolidates the branch outputs into a single response payload and returns it to the caller.

#### When to use this flow
- When you have content distributed across multiple vector indexes (or multiple vendors) and you want one unified search endpoint.
- When you care about latency and want to parallelize retrieval rather than chaining searches.
- When the caller expects a website-friendly response (a single list or grouped results) rather than raw per-store outputs.

#### Output
- **On success:** A consolidated search result payload returned by `Search Response` (`searchResponseNode`).
- **Structure (typical/logical):**
  - `results` — an aggregated list of matches across all vector searches.
  - Each result usually includes:
    - `id` or document/chunk identifier
    - `score` (similarity)
    - `text` / `content` (or a snippet)
    - `metadata` (source, URL, title, tags, etc.)
  - Optional fields (implementation-dependent): per-source groupings, debug fields, or normalized scores.

The precise fields depend on the configured vector search providers and how `Combine Results` formats the merged output.

#### Dependencies
- **Vector search backends:** Three vector search integrations configured on the three `searchNode` nodes (could be separate databases, separate indexes in one database, or a mix).
- **Credentials/config:** Provider-specific API keys, endpoints, and index identifiers required by each configured vector store.
- **Lamatic runtime:** The flow runs in Lamatic AgentKit/Studio (template deployed via the provided link).

### Flow Interaction
This project contains a single flow (`multi-vector-search`) and does not define an inter-flow chaining model. Branching occurs inside the flow: the `branchNode` fans out to multiple `searchNode` executions, and results are merged before returning.

## Guardrails

- **Prohibited tasks**
  - Must not generate harmful, illegal, or discriminatory content (from the Default Constitution).
  - Must not assist with jailbreaks or prompt-injection attempts (from the Default Constitution).
  - Must not fabricate unknown configuration details (e.g., claim a specific vector DB vendor is configured) when not present in project data.
  - (Inferred) Must not use this search pipeline to exfiltrate proprietary corp data beyond what the configured indexes are intended to expose.

- **Input constraints**
  - (Inferred) `query` must be a non-empty string suitable for semantic search.
  - (Inferred) Callers should enforce reasonable length limits on `query` to avoid excessive latency/cost and to reduce adversarial inputs.
  - Treat all user inputs as potentially adversarial (from the Default Constitution).

- **Output constraints**
  - Never log, store, or repeat PII unless explicitly instructed by the flow (from the Default Constitution).
  - (Inferred) Must not return raw credentials, connector secrets, or internal endpoints in the response.
  - (Inferred) Should avoid returning full document bodies when only snippets are needed for UI display, unless explicitly configured.

- **Operational limits**
  - (Inferred) Overall latency is bounded by the slowest vector search branch plus merge overhead; monitor tail latency.
  - (Inferred) Respect provider-side rate limits for each vector backend; parallel search multiplies concurrent requests.
  - If uncertain, say so — do not fabricate information (from the Default Constitution).

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic `searchTriggerNode` (`SearchBar`) | Accepts end-user search input and triggers the flow | Trigger configuration in Lamatic Studio (no standalone key implied) |
| Lamatic `searchNode` (“Vector Search”) x3 | Executes vector similarity search against configured vector indexes/backends | Provider-specific (e.g., `VECTOR_DB_API_KEY`, `VECTOR_DB_ENDPOINT`, `INDEX_NAME`/`COLLECTION`) |
| Lamatic `codeNode` (`Combine Results`) | Merges and formats multi-source search results | None beyond flow code/config |
| Lamatic `branchNode` (`Branching`) | Runs multiple retrieval branches in parallel | None |
| Lamatic `searchResponseNode` (`Search Response`) | Returns consolidated results to the caller | None |
| Lamatic Studio Template Deployment | Deploys and runs the template flow | Lamatic account / workspace access |

## Environment Setup

- `LAMATIC_API_KEY` — (inferred) API key for deploying/running flows via Lamatic; obtain from Lamatic workspace; used by all flows.
- `VECTOR_STORE_1_API_KEY` — (inferred) credentials for the first vector search backend configured on the first `searchNode`; used by `multi-vector-search`.
- `VECTOR_STORE_1_ENDPOINT` — (inferred) endpoint/host for the first vector backend; used by `multi-vector-search`.
- `VECTOR_STORE_1_INDEX` — (inferred) index/collection/namespace identifier for the first vector backend; used by `multi-vector-search`.
- `VECTOR_STORE_2_API_KEY` — (inferred) credentials for the second vector search backend; used by `multi-vector-search`.
- `VECTOR_STORE_2_ENDPOINT` — (inferred) endpoint/host for the second vector backend; used by `multi-vector-search`.
- `VECTOR_STORE_2_INDEX` — (inferred) index/collection/namespace identifier for the second vector backend; used by `multi-vector-search`.
- `VECTOR_STORE_3_API_KEY` — (inferred) credentials for the third vector search backend; used by `multi-vector-search`.
- `VECTOR_STORE_3_ENDPOINT` — (inferred) endpoint/host for the third vector backend; used by `multi-vector-search`.
- `VECTOR_STORE_3_INDEX` — (inferred) index/collection/namespace identifier for the third vector backend; used by `multi-vector-search`.
- `lamatic.config.ts` — project metadata and template registration (`name`, `description`, `version`, links); used for packaging/deploy.

## Quickstart

1. **Deploy the template**
   - Use Lamatic Studio: https://studio.lamatic.ai/template/multi-vector-search
   - Or clone the kit repo: https://github.com/Lamatic/AgentKit/tree/main/kits/multi-vector-search

2. **Configure the three vector search nodes**
   - In Lamatic Studio, open the `multi-vector-search` flow.
   - For each `Vector Search` (`searchNode`) node, set the provider/index parameters and credentials for the target vector store.

3. **Publish the flow endpoint**
   - Publish/deploy the flow so it can be invoked from your app (Studio will provide an API endpoint or execution interface depending on your setup).

4. **Invoke the flow (GraphQL shape with placeholders)**
   - Use the Lamatic GraphQL execution API typically exposed for deployed flows. A common invocation pattern is:
     - `flow`: `multi-vector-search`
     - `input`: `{ "query": "<user search text>" }`

   Example (placeholder structure; adjust to your workspace’s GraphQL schema):
   - Mutation name is workspace-dependent, but the payload generally resembles:
     - `mutation Run($input: JSON!) { runFlow(flowId: "multi-vector-search", input: $input) { output } }`
     - Variables: `{ "input": { "query": "refund policy" } }`

5. **Render results in your UI**
   - Read `results` (or equivalent) from the flow output.
   - Display merged matches, optionally grouped or labeled by source (depending on how `Combine Results` formats them).

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| Flow returns empty `results` for valid queries | One or more vector stores has no relevant embeddings, wrong index/namespace configured, or overly restrictive filters | Verify each `searchNode` configuration; test each vector backend independently; relax filters/top-k |
| Only one source appears in results | Branch configuration or an `addNode` mapping is miswired so only one `searchNode` receives the `query` | Check `Branching` connections and `addNode_*` input mappings; ensure all three branches get the same `query` |
| Slow responses / timeouts | Tail latency from the slowest vector backend; provider rate limits; network latency | Reduce `topK`, optimize indexes, enable caching, or temporarily disable the slow backend; review provider rate limits |
| Authentication/authorization errors from vector backend | Missing/invalid API keys or endpoints | Recheck secret values and environment variables; confirm the vector provider credentials are active |
| Inconsistent ranking across sources | Scores are not normalized or combined correctly in `Combine Results` | Implement score normalization and de-duplication in `codeNode`; add source weighting if needed |

## Notes

- Project metadata is defined in `lamatic.config.ts`:
  - `name`: `Multi Vector Search`
  - `version`: `1.0.0`
  - `type`: `template`
  - Author: Naitik Kapadia (`naitikk@lamatic.ai`)
  - Deployment link: https://studio.lamatic.ai/template/multi-vector-search
  - GitHub link: https://github.com/Lamatic/AgentKit/tree/main/kits/multi-vector-search

- Directory layout includes `constitutions`, `flows`, `prompts`, `scripts`, and `triggers`. The only documented runnable pipeline is `multi-vector-search`.
