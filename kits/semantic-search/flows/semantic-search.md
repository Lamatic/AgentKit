# Semantic Search
A retrieval flow that accepts a natural-language query, runs vector search over an already-built semantic index, and returns UI-ready results for the wider enterprise search system.

## Purpose
This flow is responsible for the retrieval side of the semantic search kit. It solves the specific problem of turning a user-entered search query into ranked matches from content that has already been indexed into a vector database. Rather than performing ingestion, crawling, chunking, or index construction itself, it assumes those steps have already happened elsewhere and focuses only on search-time lookup and response shaping.

The outcome is a structured set of search results containing per-result tabs, titles, and content fields that can be rendered directly by a Lamatic search widget or consumed by an API-facing caller. This matters because the broader agent pipeline separates indexing from retrieval: upstream flows build and maintain the vector index from heterogeneous sources, while this flow provides the user-facing search experience over that index.

Within the larger plan-retrieve-synthesize pattern, this flow sits squarely in the retrieve layer. The parent kit uses multiple indexation flows to ingest content from sources such as cloud storage, databases, and web crawling into a unified vector store. Once that index exists, this flow is the entry point that receives a user query, performs semantic similarity search using the configured embedding model and vector database, and returns collated matches without additional synthesis.

## When To Use
- Use when a user submits a free-text query through the bundled search widget and you want semantically similar matches from previously indexed content.
- Use when one or more upstream indexation flows have already populated the target vector database with embeddings and metadata.
- Use when you need search results returned in a format suitable for direct display in a tabbed search UI.
- Use when exact keyword matching is insufficient and the desired behavior is intent-based retrieval across documents, pages, rows, or other indexed content.
- Use when the caller already knows which vector database and embedding model configuration should be applied for retrieval.

## When Not To Use
- Do not use when no indexation flow has run yet or when the target vector collection is empty.
- Do not use for content ingestion, crawling, chunking, or vectorization of source material; one of the sibling indexation flows in the kit should handle that first.
- Do not use when the input is raw source content that needs to be stored rather than searched.
- Do not use when the request requires live public-web lookup; this flow only searches the configured internal vector index.
- Do not use when the vector database connection or embedding model has not been configured in the flow inputs.
- Do not use when the user needs a synthesized answer or grounded response generation; this flow returns retrieved matches, not a generated narrative answer.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `searchQuery` | `string` | Yes | Natural-language query provided by the trigger widget and passed into vector search. |
| `vectorDB` | `select` | Yes | Private flow configuration selecting the target vector database used by the `Vector Search` node. |
| `embeddingModelName` | `model` | Yes | Private flow configuration selecting the embedding model used to embed the search query for similarity lookup. |

The trigger-facing runtime input is `searchQuery`, supplied by the `Search Widget`. The other two fields are required private configuration values on the `Vector Search` node rather than end-user-entered fields. The flow assumes the query is plain natural language and non-empty. No explicit max length or language validation is encoded in the flow, so practical limits depend on the selected embedding model and vector database.

## Outputs
| Field | Type | Description |
|---|---|---|
| `tab` | `string[]` | Per-result category or type used by the search response UI to group or label each result. |
| `title` | `string[]` | Per-result title text extracted from the collated search results. |
| `content` | `string[]` | Per-result body or snippet content extracted from the collated search results. |

The response is a structured result set intended for the Lamatic search response node, not a single prose answer. Internally, the `Collate Results` code node produces a `results` collection, and the response node maps each item's `type`, `title`, and `content` fields into parallel UI-facing fields. Completeness depends entirely on what metadata was stored during indexing and what the collate script is able to normalize from raw vector-search matches.

## Dependencies
### Upstream Flows
This flow is an entry-point retrieval flow for end-user search, but it depends operationally on one or more upstream indexation flows in the parent kit having already run.

- Any sibling indexation flow in the semantic search bundle — must have ingested source content, chunked it, embedded it, and written vectors plus useful metadata into the configured vector database.
- Required upstream data state:
  - An accessible vector index or collection in `vectorDB`
  - Stored embeddings compatible with the selected `embeddingModelName`
  - Searchable metadata sufficient for the collate step to derive `type`, `title`, and `content`

This flow directly consumes `searchQuery` from its trigger. It does not consume a runtime payload from another flow, but it is functionally dependent on prior indexing having populated the search backend.

### Downstream Flows
- No downstream Lamatic flow is explicitly wired after this flow in the provided definition.
- Its response can be consumed by a frontend search widget, external caller, or orchestration layer that needs the returned `tab`, `title`, and `content` fields.

### External Services
- Vector database selected by `vectorDB` — used to execute semantic similarity search over previously indexed embeddings — required credential depends on the configured vector DB connector
- Embedding model selected by `embeddingModelName` — used to embed the incoming search query in the `Vector Search` node — required credential depends on the chosen model provider
- Lamatic search widget trigger — used to capture the end-user query and invoke the flow — no additional credential is exposed in this flow definition

### Environment Variables
- No explicit environment variables are declared in the flow source.
- Credentials are expected to be provided through the configured vector database connector and embedding model provider used by `Vector Search`.

## Node Walkthrough
1. `Search Widget` (`triggerNode`) starts the flow when a user submits a search request through the configured widget trigger. Its job in this flow is to collect the runtime query and expose it as `triggerNode_1.output.searchQuery` for downstream use.

2. `Vector Search` (`dynamicNode` with `searchNode`) receives `{{triggerNode_1.output.searchQuery}}` as `searchQuery`, embeds that text using the configured `embeddingModelName`, and searches the selected `vectorDB` for similar items. It is configured with a result `limit` of `10`, a `certainty` threshold of `0.5`, and no additional metadata filters because `filters` is set to an empty list.

3. `Collate Results` (`dynamicNode` with `codeNode`) runs the referenced script `@scripts/semantic-search_collate-results.ts` over the raw vector-search output. Its role is to normalize or reshape the search matches into a consistent `results` structure that includes at least `type`, `title`, and `content` fields expected by the response layer.

4. `Search Response` (`dynamicNode` with `searchResponseNode`) transforms the collated `results` collection into the trigger response contract. It maps each item's `type` to `tab`, `title` to `title`, and `content` to `content`, producing the final UI-ready payload returned to the caller.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails when search starts | `vectorDB` private input is not configured or points to an unavailable vector database | Configure `vectorDB` with a valid connector and verify the backing vector service is reachable |
| Flow fails in `Vector Search` before returning results | `embeddingModelName` is missing, invalid, or lacks provider credentials | Select a valid embedding model and ensure its provider credentials are configured in Lamatic |
| Search returns no matches | The upstream indexation flows have not run, the target collection is empty, or the `certainty` threshold is too strict for the available data | Run the appropriate indexation flow first, confirm documents were indexed into the same `vectorDB`, and adjust retrieval settings if needed |
| Search returns irrelevant or weak matches | The indexed content was embedded with a different model or poor metadata/chunking choices reduced retrieval quality | Re-index content with a compatible embedding setup and review chunking and metadata mapping in the upstream indexation flow |
| Response rendering is incomplete or blank for some results | The collate script could not derive `type`, `title`, or `content` from raw search matches because upstream metadata is missing or inconsistent | Inspect the indexed metadata schema and update the indexing flow or collate script to ensure required fields are present |
| User submits malformed or empty query and gets empty output | `searchQuery` from the widget is blank or not meaningful natural-language text | Validate user input at the widget or calling layer and require a non-empty search string |
| Retrieval appears to target the wrong dataset | The configured `vectorDB` points to a different index or tenant than the one populated by the indexation flows | Align this flow's private `vectorDB` configuration with the exact backend and collection used during indexing |
| Upstream content exists but this flow still finds nothing | Upstream indexing used a different embedding space than the one configured here | Use the same or compatible embedding model family for both indexing and query-time retrieval |

## Notes
- The flow is intentionally narrow in scope: it performs retrieval and response shaping only, with no answer synthesis or reranking stage.
- Result count is capped at `10` by configuration in `Vector Search`.
- The `certainty` threshold is set to `0.5`, which affects recall and precision; changing it will alter how permissive the search is.
- `filters` is currently an empty list, so all indexed content in the configured search scope is eligible for retrieval unless the vector backend applies additional defaults.
- The final response quality depends heavily on the metadata emitted by upstream indexation flows and on the behavior of the referenced `semantic-search_collate-results` script.
- Because the trigger is a widget-based entry point, this flow is well suited for embedded search experiences in internal portals, support surfaces, or product UIs.