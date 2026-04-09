# Introduction to RAG
A single API-invoked retrieval-augmented generation flow that turns user-provided text into a temporary knowledge base and answers a user query from that grounded context, serving as the entry-point and complete execution path for this kit.

## Purpose
This flow is responsible for a focused RAG task: taking a caller-supplied body of text, converting it into retrievable chunks and vectors, indexing those vectors, and then answering a natural-language question against that indexed content. Its job is not general chat and not long-lived knowledge management; it is a self-contained grounding pipeline for answering questions from the specific text sent with the request.

The outcome is a single grounded answer returned as `answer` in the API response. That outcome matters because it constrains the language model to the supplied source material rather than relying on broad pretrained knowledge, which improves factual alignment for bounded-question answering. In practice, this makes the flow useful as a reference implementation for support, startup, and knowledge-base style use cases where the caller wants answers tied to a known text corpus.

Within the broader agent pattern, this flow covers the full ingest-to-answer chain in one pass: receive request, prepare source text, embed and index it, retrieve relevant passages, and synthesize a response. According to the parent agent context, this kit contains a single runnable flow, so this flow functions as both the entry point and the end-to-end execution path rather than one step in a larger multi-flow orchestration.

## When To Use
- Use when a caller can provide the source knowledge as raw text in the same request that asks the question.
- Use when the user asks a question that must be answered only from a bounded, caller-supplied document or passage.
- Use when you want a simple example of Lamatic AgentKit RAG covering chunking, embedding, indexing, retrieval, and answer generation in one flow.
- Use when you need a realtime API response rather than a deferred or batch result.
- Use when no persistent upstream ingestion pipeline exists and the knowledge base must be created on demand from the request payload.
- Use when the application is invoking the kit directly through the API trigger and can map `query` and `text` into the trigger output.

## When Not To Use
- Do not use when the caller does not provide `text`; this flow depends on source text to build the retrieval context.
- Do not use when the request is for open-ended conversation, brainstorming, or model knowledge outside the supplied text.
- Do not use when the input is already stored in a persistent vector store managed by another ingestion flow; in that case, a retrieval-only flow would be more appropriate.
- Do not use when the input is non-textual or requires preprocessing such as OCR, document parsing, or media transcription before chunking.
- Do not use when required model, embedding, or vector database credentials have not been configured in the workspace environment.
- Do not use when the request expects structured extraction, classification, or tool orchestration outputs instead of a single prose answer.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `query` | `string` | Yes | The natural-language question the flow should answer using retrieved context from the provided text. |
| `text` | `string` | Yes | The source text that will be chunked, embedded, indexed, and treated as the knowledge base for the query. |

The trigger schema is not explicitly declared in the flow source, but downstream bindings make `query` and `text` mandatory in practice because `Chunking` reads `{{triggerNode_1.output.text}}` and `RAG` reads `{{triggerNode_1.output.query}}`. The flow assumes `text` is plain text and large enough to benefit from chunking. No language restriction is encoded in the flow, but answer quality depends on the configured embedding and generative models supporting the input language. Very short, empty, or malformed text can lead to weak retrieval or no useful answer.

## Outputs
| Field | Type | Description |
|---|---|---|
| `answer` | `string` | The generated answer returned by the `RAG` node, grounded in the indexed content derived from the supplied `text`. |

The API response is a simple object containing one prose field, `answer`. The value is the model-generated response from the retrieval step rather than raw chunks, citations, or retrieval metadata. Completeness depends on whether relevant chunks were successfully indexed and retrieved; if retrieval is weak or indexing is misconfigured, the field may still contain a low-confidence or generic answer depending on the model and prompt behavior.

## Dependencies
### Upstream Flows
- None. This is a standalone entry-point flow invoked directly by an API-triggered GraphQL request.
- The only prerequisite is that the caller provides the request payload fields this flow expects, specifically `query` and `text`.

### Downstream Flows
- None are defined in the kit context. The parent agent describes this as the single end-to-end flow in the project.
- External callers may consume the returned `answer` field, but no additional Lamatic flow is documented as depending on it.

### External Services
- GraphQL/API trigger service — receives the inbound request and exposes request fields to the flow — required credential or environment variable depends on deployment configuration of the Lamatic API endpoint.
- Embedding model via `Vectorize` — converts prepared text chunks into embeddings for semantic retrieval — requires the embedding model credentials configured in the Lamatic workspace for the model selected by the platform or model config.
- Vector database via `Index` and `RAG` — stores vectors and serves retrieval for the query step — requires vector database connection credentials configured in the Lamatic workspace.
- Generative language model via `RAG` — synthesizes the final answer from retrieved context and the system prompt — requires the LLM provider credentials configured in the Lamatic workspace.

### Environment Variables
- `EMBEDDING_MODEL` — logical placeholder for the embedding provider/model configuration used by `Vectorize` and `RAG` — used inside `Vectorize` and `RAG` through Lamatic model configuration.
- `VECTOR_DB_*` — logical placeholder for vector store connection settings such as endpoint, index, namespace, and authentication — used inside `Index` and `RAG`.
- `LLM_*` — logical placeholder for generative model provider credentials and model selection — used inside `RAG`.

The flow source does not name concrete environment variables. Actual variable names are determined by the connected providers and the referenced Lamatic model configuration file `@model-configs/introduction-to-rag_rag.ts`.

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives a realtime API request and exposes request payload fields to the flow. In this flow, the important trigger outputs are `text`, which becomes the knowledge base, and `query`, which becomes the retrieval question.
2. `Chunking` (`chunkNode`) reads `{{triggerNode_1.output.text}}` and splits the incoming text into recursive character-based chunks. It uses a target chunk size of `1000` characters with `100` characters of overlap and prefers splitting on paragraph breaks, then line breaks, then spaces. This prepares the source text for embedding while preserving enough local context across chunk boundaries.
3. The first `Code` (`codeNode`) consumes the chunking output and runs the referenced script `@scripts/introduction-to-rag_code.ts`. Although the script body is external to the flow source, its position and downstream bindings indicate that it reshapes or normalizes chunk data into the form expected by embedding.
4. `Vectorize` (`vectorizeNode`) reads `{{codeNode_502.output}}` and generates embeddings for the prepared chunk text. The flow does not hardcode an embedding model in this node, so the actual provider and model are resolved from workspace or platform configuration.
5. The second `Code` (`codeNode`) runs the same referenced script again, this time after vectorization. Its downstream mappings show that it emits at least `vectors` and `metadata`, packaging vector results and associated metadata into the structure required by indexing.
6. `Index` (`IndexNode`) ingests `{{codeNode_352.output.vectors}}` and `{{codeNode_352.output.metadata}}` into the configured vector database. Its duplicate handling is set to `overwrite`, meaning repeated writes for the same effective records replace existing indexed entries rather than creating duplicates.
7. `RAG` (`RAGNode`) queries the indexed content using `{{triggerNode_1.output.query}}`. It applies the referenced system prompt `@prompts/introduction-to-rag_rag_system.md` and uses additional retrieval and model settings from `@model-configs/introduction-to-rag_rag.ts`, including the embedding model, generative model, retrieval certainty, message handling, memory behavior, and result limit. This node retrieves relevant chunks from the vector store and synthesizes the grounded final response.
8. `API Response` (`graphqlResponseNode`) maps the generated model output to the external API contract. Specifically, it returns a JSON object where `answer` is populated from `{{RAGNode_149.output.modelResponse}}`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request succeeds but `answer` is empty or irrelevant | `text` was empty, too short, poorly formatted, or not mapped into `triggerNode_1.output.text` | Verify the request payload includes non-empty `text`, confirm trigger field mapping, and test with a larger well-formed passage. |
| Flow fails during embedding or retrieval | Embedding model credentials or provider configuration are missing | Configure the required embedding provider credentials in Lamatic and verify the model referenced by workspace or model config is available. |
| Flow fails during indexing or retrieval from the vector store | Vector database connection is unset, invalid, or inaccessible | Configure the vector database connection used by `Index` and `RAG`, verify authentication, endpoint, and target index settings, and retest connectivity. |
| `answer` does not reflect the provided text | Query-to-text mismatch, weak chunking for the content shape, or retrieval settings not tuned for the corpus | Check that `query` is grounded in the supplied text, adjust chunk size or overlap in a derived flow if needed, and review the RAG model config for certainty and limit settings. |
| Triggered request returns an error before processing | Malformed API or GraphQL payload | Ensure the caller sends a valid request body containing `query` and `text` as strings and that the deployed API schema exposes those fields. |
| Indexing appears to overwrite prior data unexpectedly | `duplicateOperation` is set to `overwrite` in the `Index` node | If persistence across requests matters, use unique primary keys and review duplicate handling in a customized version of the flow. |
| Runtime error in one of the `Code` nodes | The referenced script `@scripts/introduction-to-rag_code.ts` is missing, invalid, or incompatible with upstream node output shape | Confirm the script file exists, validate its expected input/output contract, and test it independently against chunk and vectorize outputs. |
| Retrieval returns no useful context | The vector store was not populated correctly before the `RAG` node ran | Inspect outputs of the second `Code` node, ensure `vectors` and `metadata` are present, and verify that `Index` completed successfully before `RAG` execution. |
| Caller expects another flow to pre-ingest data | No upstream ingestion flow exists in this kit; this flow is the ingestion and answering path combined | Route requests directly to this flow and provide the full source `text` in each invocation, or build a separate ingestion flow for persistent knowledge bases. |

## Notes
- This template is best understood as on-demand RAG rather than a persistent enterprise knowledge pipeline. It builds retrieval context from request-supplied text inside the same execution path.
- The flow source declares no explicit trigger schema in `inputs`, so the API contract is inferred from variable references. In production, document and enforce `query` and `text` at the gateway or GraphQL schema layer.
- Both `Code` nodes reference the same script file. That suggests the script is reused for different transformation stages, so any modification to that file can affect both pre-vectorization and pre-indexing behavior.
- The `RAG` node relies on external prompt and model-config references. Changes to `@prompts/introduction-to-rag_rag_system.md` or `@model-configs/introduction-to-rag_rag.ts` can materially change answer style, retrieval strictness, and model behavior without altering the flow graph itself.
- Concrete vector database and model names are not embedded in this flow source. Operators should treat deployment-time provider configuration as part of the canonical runtime contract.
- Because the response only returns `answer`, debugging retrieval quality may require inspecting intermediate node outputs in Lamatic Studio rather than relying on the API response alone.