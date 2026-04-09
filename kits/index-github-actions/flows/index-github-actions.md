# Index GitHub Actions
A webhook-triggered ingestion flow that transforms GitHub Actions content into vector embeddings and stores them in a vector database, serving as the indexing backbone for downstream search and RAG systems.

## Purpose
This flow is responsible for turning raw GitHub Actions data into a searchable knowledge asset. It receives webhook-delivered content, breaks that content into retrieval-friendly chunks, generates embeddings for each chunk, prepares aligned metadata, and writes the resulting records into a vector database. In effect, it solves the ingestion side of the problem: converting operational CI/CD artifacts and related textual context into a form that AI systems can search semantically.

The outcome is an up-to-date vector index of GitHub Actions material. That matters because downstream retrieval and question-answering systems depend on this index to find relevant workflows, reusable actions, configuration details, and operational context quickly and accurately. Without this flow, later search or RAG components would have no grounded corpus to retrieve from, or would operate on stale data.

Within the broader agent system, this flow sits at the ingestion and indexing stage of the pipeline rather than the retrieval or synthesis stage. It is the entry point that prepares knowledge for later consumption by search and RAG flows. In a plan-retrieve-synthesize framing, this flow is part of the "prepare and index" layer that must exist before retrieval can succeed.

## When To Use
- Use when GitHub or a GitHub-adjacent automation sends a webhook event containing GitHub Actions content that should be added to or refreshed in the semantic index.
- Use when you need GitHub Actions workflows, action definitions, or related text to become searchable via vector similarity.
- Use when a downstream RAG or search system depends on freshly indexed CI/CD context.
- Use when repository automation, workflow files, or action documentation changes and the vector store needs to be updated.
- Use when you are building or maintaining a continuously refreshable knowledge base of GitHub Actions assets.

## When Not To Use
- Do not use when the incoming payload does not contain any chunkable textual content in `content`.
- Do not use when your goal is to answer a user question directly; this flow indexes data but does not retrieve or synthesize answers.
- Do not use when embedding model configuration has not been set up, because vector generation cannot complete without it.
- Do not use when the target vector database has not been configured, because the flow cannot persist the embeddings.
- Do not use for non-GitHub-Actions content unless you have confirmed the webhook payload shape and metadata preparation script are compatible.
- Do not use as a follow-on step from another flow in this template set; this flow is the standalone ingestion entry point.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `content` | `string` | Yes | The raw textual content extracted from the webhook payload and passed from the trigger into chunking. This is the primary body of GitHub Actions-related material that will be split, embedded, and indexed. |
| Additional webhook payload fields | `object` | Likely | The trigger may receive additional structured request fields such as repository identifiers, file paths, refs, event types, timestamps, or other metadata needed by the metadata preparation script, although these are not explicitly declared in the flow source. |
| Webhook request headers | `object` | Optional | Transport and integration headers provided by the webhook caller. These may include event or signature headers depending on deployment, but they are not referenced directly in the visible flow definition. |

The flow has no statically declared `inputs` object, so it behaves as a webhook entry point rather than a parameterized callable flow. The only explicitly consumed trigger field in the graph is `triggerNode_1.output.content`, which means `content` must be present by the time the trigger emits its normalized output. In practice, the payload should contain enough meaningful text to justify chunking and embedding; extremely short, empty, or malformed content will lead to poor or failed indexing.

## Outputs
| Field | Type | Description |
|---|---|---|
| Flow response | `object` | The terminal response emitted after indexing completes. The exact schema is not explicitly defined in the source, but it represents the result of the indexing pipeline after the `Index` node and final pass-through `addNode`. |
| `vectors` | `array` | Intermediate output from the metadata preparation step containing vectors aligned for indexing. This is consumed internally by the `Index` node rather than exposed as a documented public API field. |
| `metadata` | `array` | Intermediate output from the metadata preparation step containing metadata records aligned with the vectors for insertion into the vector database. This is consumed internally by the `Index` node rather than exposed as a documented public API field. |

The public response shape is not fully specified in the flow source. Operationally, this flow behaves like an ingestion job: it accepts webhook data, processes it, and completes with an indexing result rather than returning a user-facing content payload. Developers integrating with it should treat the response as a structured status/result object from the indexing operation, and should not assume it returns the chunk texts or embeddings unless they explicitly inspect the runtime behavior of the deployed nodes.

## Dependencies
### Upstream Flows
- This flow has no upstream Lamatic flow dependencies and acts as the entry-point ingestion flow for the template.
- It is invoked directly by an external webhook source, most likely GitHub or an adjacent automation system that sends GitHub Actions-related payloads.
- The required precondition is not another flow having run, but the external system having produced a webhook payload whose normalized trigger output includes `content` and any metadata expected by the preparation script.

### Downstream Flows
- No specific downstream flow is defined in the provided template artifacts.
- Conceptually, downstream search, retrieval, or RAG flows depend on the vector records written by this flow to the vector database rather than on its immediate API response.
- Those downstream systems will rely on the indexed vectors and metadata persisted by this flow, especially the records written through `vectorsField` and `metadataField` in the `Index` node.

### External Services
- GitHub webhook source — provides the triggering event and payload content — requires webhook configuration in GitHub or the calling automation system
- Embedding model provider — converts text chunks into vector embeddings — requires whatever model credential or provider configuration is associated with the selected embedding model in the `Vectorize` node
- Vector database — stores vectors and metadata for later semantic retrieval — requires the vector database connection configured on the `Index` node
- Lamatic runtime — executes the webhook, chunking, code, vectorization, and indexing nodes — requires deployment within a configured Lamatic workspace

### Environment Variables
- `EMBEDDING_MODEL` or provider-specific model credentials — used to authorize and select the embedding backend — used by the `Vectorize` node
- `VECTOR_DB` and provider-specific vector database credentials — used to connect to the target vector store and write indexed records — used by the `Index` node
- Any webhook secret or signature validation variable, if configured in deployment — used to secure inbound webhook delivery — used by the `Github Action Webhook` node

## Node Walkthrough
1. `Github Action Webhook` (`webhookTriggerNode`) receives an inbound webhook request that contains GitHub Actions-related content. This node starts the flow and emits a normalized trigger output. The only field explicitly referenced later is `content`, which becomes the raw text body for indexing.

2. `Chunking` (`chunkNode`) reads `triggerNode_1.output.content` and splits it into smaller passages using a recursive character strategy. It targets chunks of `1000` characters with `100` characters of overlap and prefers to split on paragraph breaks, then line breaks, then spaces. This balancing of chunk size and overlap is designed to preserve context while making each segment suitable for embedding and retrieval.

3. `Vectorize` (`vectorizeNode`) takes the `pageContent` from every produced chunk and generates embeddings for them. The input mapping shows an array-style extraction over all chunk contents, so this node vectorizes the full set of chunk texts in batch or sequence depending on runtime implementation. The selected embedding model is not fixed in source, which means it must be configured in the environment or workspace.

4. `Prepare Metadata` (`codeNode`) runs the referenced script `@scripts/index-github-actions_prepare-metadata.ts`. This step bridges the chunking and vectorization outputs into the exact structure expected by the indexer. It prepares at least two aligned outputs: `vectors` and `metadata`. The metadata likely preserves source context such as repository or document attributes so that retrieved chunks remain attributable and useful downstream.

5. `Index` (`IndexNode`) writes the prepared vectors and metadata into the configured vector database. It consumes `codeNode_443.output.vectors` and `codeNode_443.output.metadata` and uses `duplicateOperation` set to `overwrite`, indicating that when duplicate keys are detected, existing records should be replaced rather than appended. The actual vector database target and primary key configuration are left blank in source and must be supplied before deployment.

6. The terminal `addNode` receives control after indexing completes and serves as the flow's endpoint. It does not show any custom field mapping in source, so it functions as a final pass-through or response terminator rather than a substantive transformation step.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Webhook call succeeds but no records are indexed | The incoming payload did not produce a usable `content` field, or `content` was empty | Ensure the webhook payload is normalized so the trigger emits `content` as non-empty text; validate the sender and inspect trigger output in test runs |
| Chunking produces no usable chunks | `content` is missing, too short, or malformed | Send plain text or text-extractable content; confirm the webhook body contains GitHub Actions material rather than only metadata |
| Vectorization fails | Embedding model configuration is missing or invalid | Configure the embedding model and required provider credentials in the Lamatic workspace before running the flow |
| Indexing fails with connection or authentication errors | Vector database target is not configured, credentials are missing, or the selected collection/index is inaccessible | Set the vector database connection, credentials, and collection details on the `Index` node and verify access from the runtime environment |
| Indexed records are duplicated or unexpectedly replaced | Duplicate handling is configured as `overwrite`, and key selection may not match your intended uniqueness model | Define stable primary keys and confirm overwrite behavior is appropriate for your ingestion strategy |
| Metadata and vectors do not align | The `Prepare Metadata` script generated mismatched arrays or encountered unexpected payload structure | Review and test `@scripts/index-github-actions_prepare-metadata.ts` against real webhook payloads to ensure one metadata object exists per vector |
| Flow runs but downstream retrieval returns poor results | Chunking parameters or source content quality are not appropriate for the data being indexed | Revisit chunk size, overlap, and source text extraction quality; confirm the webhook is sending the right textual artifacts |
| Invocation never reaches the flow | The webhook source has not been configured or is pointing to the wrong endpoint | Verify webhook registration, target URL, delivery logs, and any secret/signature settings |
| A caller expects a rich API payload but receives only a status-like result | This flow is an ingestion pipeline, not a retrieval endpoint, and its response schema is minimal | Integrate downstream systems with the vector database or retrieval flow instead of relying on this flow to return indexed content |
| A supposed upstream flow output is missing | There is no upstream Lamatic flow; the external event source did not send the required payload | Route the original webhook event directly to this flow and validate the payload before delivery |

## Notes
- The flow source leaves `embeddingModelName`, `vectorDB`, and `primaryKeys` effectively unconfigured. This means the template is structurally complete but operationally dependent on environment-specific setup before it can run successfully.
- The metadata preparation logic lives in an external script reference rather than inline configuration. That script is critical because it determines how vectors are paired with metadata and, indirectly, how useful retrieved results will be later.
- Because chunking is character-based rather than schema-aware, very large YAML files or mixed-format payloads may split at semantically awkward points. If retrieval quality matters, test chunking behavior on representative workflow files and adjust if needed.
- The flow is designed for continuous refresh through webhook-driven updates. Given `duplicateOperation` is `overwrite`, it is better suited to idempotent re-indexing of known documents than to append-only historical archiving.