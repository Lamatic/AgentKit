# Search Widget
A retrieval-augmented widget flow that turns a user’s search query into a UI-ready, source-grounded response and serves as the entry-point search experience in the broader Search Widget agent system.

## Purpose
This flow is responsible for answering end-user search requests against an indexed knowledge base rather than relying on unguided model generation. It accepts a search query from a widget trigger, uses a retrieval-augmented generation step to pull relevant context from a configured vector database, and formats the result into a response shape intended for direct rendering in a search UI.

The outcome is a consistent, grounded search result that can include both generated synthesis and source-backed reference material. That matters because the wider agent pipeline is designed to provide support and discovery experiences that are fast, accurate, and aligned to internal content. By encapsulating retrieval and response formatting in a single callable flow, the system gives developers a stable interface for embedding knowledge search into product surfaces.

Within the broader plan-retrieve-synthesize chain, this flow is both the entry point and the full execution path for this template. It receives the user query, performs the retrieval and synthesis phase in `RAG`, and completes the presentation phase in `Search Response`. There are no separate planner or orchestration subflows in this kit; this flow is the canonical end-to-end implementation of the search widget behavior.

## When To Use
- Use when a front-end search widget, support panel, or self-serve help surface needs to answer a natural-language query from indexed internal or curated knowledge.
- Use when the desired answer should be grounded in retrieved documents from a vector database rather than generated only from base model knowledge.
- Use when the caller needs a widget-friendly response structure rather than a free-form chat transcript.
- Use when the application wants source-linked or reference-backed output derived from retrieved documents.
- Use when the query is a single-turn search request that can be answered from the currently configured knowledge index.

## When Not To Use
- Do not use when no vector database or retrieval backend has been configured for the `RAG` node.
- Do not use when the caller does not provide a search query or provides only empty whitespace.
- Do not use for workflows that require multi-turn conversational memory beyond what the configured `RAG` model settings support.
- Do not use when the task requires transactional actions, system mutations, or tool execution rather than knowledge retrieval and answer synthesis.
- Do not use when a different flow is responsible for web search, structured database lookup, or document ingestion; this flow is for query-time retrieval over an already indexed corpus.
- Do not use if the expected input is a file, binary payload, or complex structured object rather than a simple search string.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `searchQuery` | `string` | Yes | The end-user’s natural-language search text, supplied by the widget trigger and passed into `RAG.queryField`. |
| `domains` | `string` or widget-specific config | No | Domain or source scoping configured on the widget trigger reference. This is defined by the widget trigger settings rather than the flow source itself and may be used to constrain where searches originate. |

The flow source exports no additional private input fields, so invocation is driven entirely by the trigger payload and its widget configuration. The key validation assumption is that `searchQuery` must be present and meaningful. The TypeScript does not show explicit max-length enforcement or language restrictions, so those constraints should be handled by the calling UI or by downstream model limits. If domain scoping is used, it must conform to the referenced widget trigger configuration.

## Outputs
| Field | Type | Description |
|---|---|---|
| `title` | `string[]` | A list of filenames drawn from `RAG.output.references[:].filename`, representing the titles or labels of retrieved source documents. |
| `content` | `string[]` | A list of content snippets or document bodies drawn from `RAG.output.references[:].content`, intended for widget display. |
| `link` | `string` | A link field exposed by the response node but left unconfigured in this flow template, so it is typically empty unless customized. |
| `breadcrumpsField` | `string` | A breadcrumb-style field exposed by the response node but left unconfigured in this template, so it is typically empty unless customized. |

The response is a structured widget payload rather than a plain text chat reply. In this template, the visible output is assembled primarily from the retrieved reference set, with `title` and `content` emitted as parallel lists sourced from the `RAG` node’s references. Because both `link` and `breadcrumpsField` are blank in the configuration, implementers should expect those fields to be empty unless they extend the flow. Completeness depends on retrieval quality and the availability of references in the vector-backed knowledge store.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow for the Search Widget kit.
- The flow is invoked directly by a widget-facing trigger and does not consume outputs from any prior Lamatic flow.

### Downstream Flows
- None are defined in this kit.
- This flow is intended to terminate in a response delivered back to the invoking widget or application surface.
- If a larger system wraps this flow, downstream consumers would typically use the response fields `title`, `content`, `link`, and `breadcrumpsField` to render UI results, but no explicit downstream flow dependency is declared.

### External Services
- Vector database connector — used by `RAG` to retrieve relevant documents for the incoming `searchQuery` — required credential depends on the vector store configured in the referenced `model-configs/search-widget_rag.ts` and workspace connector setup.
- Large language model — used by `RAG` to synthesize a grounded answer or retrieval result from the retrieved context — required credential depends on the provider configured in `model-configs/search-widget_rag.ts`.
- Embedding model — used by `RAG` for query embedding during vector retrieval — required credential depends on the provider configured in `model-configs/search-widget_rag.ts`.
- Widget trigger surface — used by `Search Widget` to accept interactive API or UI search requests — required configuration is defined in `triggers/widgets/search-widget_search-widget.ts`.

### Environment Variables
- `VECTOR_DB_*` — vector store connection details for retrieval in `RAG` — used by `RAG` through the configured vector database integration.
- `LLM_*` — model provider credentials for generation in `RAG` — used by `RAG` through the configured generative model.
- `EMBEDDING_*` — embedding provider credentials for query vectorization in `RAG` — used by `RAG` through the configured embedding model.

This flow’s TypeScript does not declare explicit environment variable names. The actual variables are determined by the providers and connectors referenced in `@model-configs/search-widget_rag.ts` and the workspace-level Lamatic integration setup.

## Node Walkthrough
1. `Search Widget` (`searchTriggerNode`) receives the incoming search request from the widget surface. Its job in this flow is to expose the user-entered query as `triggerNode_1.output.searchQuery` and hand that value into the retrieval stage. The trigger also carries widget-specific configuration through the referenced trigger file, including any domain settings associated with the widget.

2. `RAG` (`RAGNode`) performs the core retrieval-augmented step. It takes `{{triggerNode_1.output.searchQuery}}` as `queryField`, applies the model and retrieval settings defined in `@model-configs/search-widget_rag.ts`, and runs with the system prompt from `@prompts/search-widget_rag_system.md`. Operationally, this node is responsible for querying the configured vector database, retrieving relevant references, and producing outputs that include a `references` collection with fields such as `filename` and `content`. This is the node that turns a raw query into grounded knowledge.

3. `Search Response` (`searchResponseNode`) formats the retrieval output into the widget response. It maps `{{RAGNode_793.output.references[:].filename}}` into `title` and `{{RAGNode_793.output.references[:].content}}` into `content`, creating a UI-friendly representation of the retrieved sources. The `link` and `breadcrumpsField` outputs are present in the node schema but are not populated in this template. Through the response edge, this node serves as the final API response returned to the caller.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| No response or request rejection at invocation | The widget trigger did not receive a valid `searchQuery`, or the caller sent an empty payload | Ensure the caller sends a non-empty natural-language query in the trigger request and validate input in the UI before invoking the flow |
| `RAG` returns no useful references | The vector database is empty, incorrectly indexed, too restrictive, or not connected | Verify the knowledge base has been indexed, confirm vector store connectivity, and review retrieval settings in `@model-configs/search-widget_rag.ts` |
| Model or retrieval execution fails with authentication errors | Required provider credentials for the vector store, embedding model, or generative model are missing or invalid | Reconfigure the Lamatic workspace connectors and provider credentials used by `RAG` |
| Output contains empty `link` or breadcrumb data | The template leaves `link` and `breadcrumpsField` unconfigured | Customize `Search Response` to map actual source URLs or breadcrumb metadata if the widget requires them |
| Results are irrelevant or low quality | Poor embeddings, weak prompt tuning, bad chunking, or an unsuitable retrieval limit/certainty configuration | Tune the prompt, retrieval `limit`, `certainty`, chunking strategy, and provider settings in `@model-configs/search-widget_rag.ts` |
| Upstream flow not having run | The flow was expected to receive data from another flow, but this kit defines none | Invoke this flow directly as the entry point; do not wait for a prior Lamatic flow unless you have added one in a custom orchestration layer |
| Response formatting appears mismatched with the UI | The consuming front end expects a different response schema than `searchResponseNode` emits | Align the front-end renderer to the current fields or extend `Search Response` to produce the required schema |

## Notes
- The flow exports an empty `inputs` object, which means configuration is expected to live in referenced resources and workspace integrations rather than in explicit per-flow private inputs.
- The `RAG` node references the default constitution indirectly through the flow references set, indicating that safety and prompt-governance behavior may be inherited from the broader Lamatic configuration even though it is not directly mapped in the node fields shown here.
- The template is intentionally minimal: it exposes retrieved filenames and contents but does not configure source URLs, breadcrumbs, or richer card metadata. Most production deployments will want to extend the response mapping.
- Performance and answer quality depend heavily on the vector index, embedding quality, retrieval parameters, and model choice in `@model-configs/search-widget_rag.ts`.
- The field name `breadcrumpsField` appears exactly as configured in the source and may reflect a product-specific schema or a naming typo. Preserve it unless you are intentionally changing the contract for downstream consumers.