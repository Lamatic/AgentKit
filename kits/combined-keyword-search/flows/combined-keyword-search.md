# Combined Keyword Search
A parallel keyword-retrieval flow that fans out a user search across multiple BM25-backed indexes, merges the results, and returns a single response set for website or application search experiences.

## Purpose
This flow is responsible for deterministic keyword retrieval across multiple content indexes. Instead of relying on a single search backend, it accepts a user-entered search query from a UI trigger, executes parallel full-text searches against several configured vector databases, and consolidates those hits into one result set. Its specific job is not answer generation or conversational synthesis; it is focused retrieval with a unified response shape.

The outcome of the flow is a combined list of search results drawn from `IntroVector`, `TranslationVector`, and `TitlesVector`, shaped into the response expected by the search UI. That matters because the wider system can expose one search surface to end users while keeping indexing strategies split by content type or source. The flow centralizes result merging so ranking, deduplication, and result shaping do not need to be reimplemented in the client.

In the broader agent context, this flow sits at the retrieval layer and acts as the entry point for keyword-based discovery. Per the parent agent definition, it is a single-flow pipeline rather than one stage inside a longer multi-flow chain. Conceptually, it occupies the retrieve step in a plan-retrieve-synthesize model: it receives a direct search intent, performs backend retrieval, and returns ranked matches without a downstream synthesis phase.

## When To Use
- Use when a user submits a keyword search from a website or application search bar.
- Use when relevant content may exist across multiple indexes and you want one merged result set.
- Use when you need BM25-style lexical matching rather than semantic answer generation.
- Use when low-latency retrieval matters and parallel fan-out across backends is desirable.
- Use when the caller expects structured search results such as titles and content snippets, not a prose answer.
- Use when the system should hide backend-specific search differences from the client and expose a single response contract.

## When Not To Use
- Do not use when the request is for a generated answer, summary, or conversational response; use a generation-oriented flow instead.
- Do not use when no keyword query string is available at the trigger.
- Do not use when the relevant content has not been indexed into the configured vector databases `IntroVector`, `TranslationVector`, or `TitlesVector`.
- Do not use when you need advanced filtering, faceting, tenant isolation, or custom ranking controls unless the trigger and merge script have been extended to support them.
- Do not use when a sibling or custom flow is responsible for semantic vector search, hybrid retrieval, or domain-specific search behavior.
- Do not use as a downstream dependency expecting prior orchestration output; this flow is the system's entry-point search flow.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `searchQuery` | `string` | Yes | The user-entered keyword query extracted by the `SearchBar` trigger and passed to all three search nodes. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The TypeScript flow definition exposes no explicit additional input schema beyond the trigger, but execution assumes that `searchQuery` is a non-empty string. The parent agent documentation mentions possible logical fields such as `topK` and `filters`, but they are not wired into this flow's current node configuration and therefore are not consumed here. Search behavior is lexical, so exact terms, spelling, and language matching characteristics depend on how the underlying indexes were built.

## Outputs
| Field | Type | Description |
|---|---|---|
| `title` | `string[]` | The list of result titles emitted by `Search Response`, sourced from `codeNode_621.output.results[:].title`. |
| `content` | `string[]` | The list of result content snippets or bodies emitted by `Search Response`, sourced from `codeNode_621.output.results[:].content`. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The response is a structured search-result payload suitable for a search widget, not a prose paragraph. Internally, the flow produces a merged `results` collection in the `Combine Results` code node, and the response node maps array fields from that collection into parallel lists of `title` and `content`. Each upstream search node is configured with `limit: 10`, so the merged set is bounded by what each backend returns and whatever filtering, ordering, or deduplication logic is implemented in the combine script. The response node does not populate `link` or breadcrumb data in the current configuration.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow invoked directly by the `SearchBar` trigger.
- The only prerequisite is that the caller provide a valid `searchQuery` through the trigger payload.
- Operationally, the configured search indexes must already exist and contain searchable content, but no prior Lamatic flow must run before this one.

### Downstream Flows
- None are defined in the provided agent context. This flow returns its response directly to the invoking UI or application.
- If a custom downstream consumer is added later, it would most likely consume the merged result fields produced by `Combine Results`, especially each result item's `title` and `content`.

### External Services
- `SearchBar` widget trigger — captures the user search request from a website or app UI — required trigger/widget configuration in `@triggers/widgets/combined-keyword-search_searchbar.ts`
- `IntroVector` full-text search connector — queried for keyword matches against the intro-content index — required credentials depend on how this vector database connector is configured in the workspace
- `TranslationVector` full-text search connector — queried for keyword matches against the translation-content index — required credentials depend on how this vector database connector is configured in the workspace
- `TitlesVector` full-text search connector — queried for keyword matches against the titles index — required credentials depend on how this vector database connector is configured in the workspace
- `Combine Results` script — merges and reshapes results from all search backends — uses `@scripts/combined-keyword-search_combine-results.ts`

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Any required credentials are implicit in the Lamatic workspace configuration for the `fullTextSearchNode` connectors targeting `IntroVector`, `TranslationVector`, and `TitlesVector`.

## Node Walkthrough
1. `SearchBar` (`triggerNode`) starts the flow when a user submits a search through the configured widget or UI trigger. Its primary output used in this flow is `triggerNode_1.output.searchQuery`, which becomes the common query string for all downstream searches.
2. `Branching` (`branchNode`) receives the trigger event and fans execution out into three parallel branches. This node does not transform the query; its role is to allow all configured search backends to run concurrently for lower latency.
3. The first branch passes through an unnamed `addNode` (`addNode_475`) that acts as structural wiring, then invokes the unnamed `fullTextSearchNode` (`fullTextSearchNode_874`) against `IntroVector` with `limit` set to `10` and `searchQuery` bound to `{{triggerNode_1.output.searchQuery}}`. This branch retrieves intro-related keyword matches.
4. The second branch passes through an unnamed `addNode` (`addNode_165`) and then into `Keyword Search` (`fullTextSearchNode_296`), which queries `TranslationVector` with the same `searchQuery` and a `limit` of `10`. This branch retrieves translation-related keyword matches.
5. The third branch passes through an unnamed `addNode` (`addNode_135`) and then into `Keyword Search` (`fullTextSearchNode_458`), which queries `TitlesVector` with the same `searchQuery` and a `limit` of `10`. This branch retrieves title-oriented keyword matches.
6. Each search branch then flows through an unnamed `addNode` used only to converge branch outputs: `addNode_420` after the `IntroVector` search, `addNode_688` after the `TranslationVector` search, and `addNode_222` after the `TitlesVector` search. These nodes do not appear to alter payload contents; they support graph aggregation.
7. The three converged branch outputs meet at another unnamed `addNode` (`addNode_262`), which acts as the synchronization point before post-processing. It ensures the merge logic can execute after all parallel searches have produced their outputs.
8. `Combine Results` (`codeNode`) runs the script referenced at `@scripts/combined-keyword-search_combine-results.ts`. This node is responsible for combining the separate search result sets into a single `results` collection. Although the script body is not included here, the downstream bindings show that each merged result item is expected to expose at least `title` and `content` fields.
9. `Search Response` (`searchResponseNode`) formats the final response back to the trigger caller. It maps `{{codeNode_621.output.results[:].title}}` to the response `title` field and `{{codeNode_621.output.results[:].content}}` to the response `content` field. The `link` and `breadcrumpsField` fields are left empty in this configuration, so the user receives text results without URL or breadcrumb metadata.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| No response results are returned for a query that should match content | The query string in `searchQuery` is empty, malformed, or too specific for the indexed corpus | Validate that the trigger sends a non-empty `searchQuery`; test with known indexed terms; consider normalizing case, punctuation, or stemming in the indexing/search layer |
| Only partial results appear from some sources | One or more of `IntroVector`, `TranslationVector`, or `TitlesVector` is unavailable, misconfigured, or empty | Verify connector configuration and credentials in the Lamatic workspace; confirm each index contains data; test each `fullTextSearchNode` independently |
| The flow fails when invoking a search node | Missing or invalid credentials for the underlying full-text/vector database connector | Reconfigure the affected backend connection in Lamatic and ensure the required provider credentials are present |
| The final response has blank `title` or `content` entries | The `Combine Results` script is not returning items with the expected `title` and `content` fields | Review `@scripts/combined-keyword-search_combine-results.ts`; ensure it normalizes every backend result into a shared schema before returning `results` |
| The flow does not start from the UI | The `SearchBar` trigger widget is not configured, deployed, or correctly embedded | Check `@triggers/widgets/combined-keyword-search_searchbar.ts`, confirm widget deployment, and verify that the client is sending the expected trigger payload |
| The user expects links in results but none are shown | The `Search Response` node has `link` configured as an empty value | Extend the combine script to emit URL fields and map them into the response node's `link` field |
| Query-time filtering or custom result counts do not work | The parent agent mentions logical `topK` and `filters`, but this flow does not wire them into any node | Update the trigger contract and pass those fields into the search nodes and merge script if such behavior is required |
| Upstream flow data is missing | A caller assumes this flow consumes outputs from a prior Lamatic flow, but it is actually a standalone entry point | Invoke this flow directly from the search UI or API and provide `searchQuery` at the trigger instead of expecting chained upstream state |

## Notes
- The flow metadata and README describe the search method as BM25-style keyword search, but the exact scoring and merge behavior depend on the implementation of the underlying search connectors and the `Combine Results` script.
- There are three separate search backends hard-coded in the current graph: `IntroVector`, `TranslationVector`, and `TitlesVector`. Adding or removing sources requires graph changes and likely updates to the merge script.
- The branch-and-merge structure is optimized for latency by allowing all searches to run in parallel, but total response time will still be constrained by the slowest backend unless timeout handling is implemented in the platform or script layer.
- Because the response node currently exposes only `title` and `content`, any richer fields produced during retrieval, such as score, source, URL, or document identifiers, are not surfaced to the client unless the flow is extended.
- Several nodes are unnamed `addNode` instances used for branch wiring and synchronization. They are operationally important to the graph but do not represent business logic transformations.