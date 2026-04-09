# 1A. Embedded Chatbot - PDF Indexation
This flow ingests a PDF from a URL, converts it into searchable vector embeddings, and stores them in the configured vector database as the PDF ingestion stage of the broader embedded chat system.

## Purpose
This flow is responsible for turning a single PDF document into indexed knowledge that the embedded chat experience can later retrieve. Its job is not to answer user questions directly, but to prepare document content so later retrieval and chat flows can ground responses in that content. In practical terms, it accepts a document title and PDF URL, extracts text from the file, splits that text into retrieval-friendly chunks, generates embeddings, and writes those vectors plus metadata into a vector database.

The outcome is a persisted vectorized representation of the document, keyed by document metadata and ready for semantic search. That matters because the downstream chat flow depends on having relevant chunks already indexed; without this ingestion step, the system has no document knowledge to retrieve from. The flow also standardizes metadata such as `title` and `source`, which helps with traceability, duplicate handling, and later content management.

Within the larger Embedded Chat agent pipeline, this is an entry-point ingestion flow on the “index” side of the ingest → retrieve → answer lifecycle. The parent agent uses separate flows for PDF ingestion, website ingestion, chat, and deletion. This flow specifically handles PDF-based content so that the retrieval and synthesis stages can later operate over document embeddings rather than raw files.

## When To Use
- Use when a PDF has been uploaded or otherwise made available at a reachable URL and you want it added to the embedded chat knowledge base.
- Use when a user or operator wants a document to become searchable through the chat interface.
- Use when onboarding internal documentation, resumes, manuals, reports, or other PDF assets into the vector index.
- Use when the source content is already a PDF and does not require website crawling.
- Use when re-indexing an updated PDF under the same `title` is acceptable, because duplicates are configured to `overwrite`.

## When Not To Use
- Do not use for website or HTML ingestion; the sibling website indexation flow is the correct path for URLs that should be crawled rather than parsed as PDFs.
- Do not use when the input is raw text, a question, or a chat message; the chat flow handles question answering.
- Do not use when the document should be removed from the knowledge base; the resource deletion flow is the correct operational path.
- Do not use when no vector database has been configured for `IndexNode_622`.
- Do not use when no embedding model has been configured for `vectorizeNode_639`.
- Do not use when the provided `url` is not a valid, accessible PDF resource.
- Do not use if the upstream caller cannot provide the trigger fields this flow expects, especially `title` and `url`.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | string | Yes | Human-readable document title used in metadata and as the primary key for indexing. |
| `url` | string | Yes | Publicly reachable or otherwise accessible URL of the PDF file to extract and index. |
| `embeddingModelName` | model | Yes | Embedding model selection used by `vectorizeNode_639` to convert text chunks into vectors. |
| `vectorDB` | select | Yes | Vector database connection or target index used by `IndexNode_622` to persist embeddings and metadata. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The trigger payload assumes `title` and `url` are present in the API request body available to `triggerNode_1.output`. The `url` must point to a file that can be processed as `pdf`; inaccessible links, expired signed URLs, or non-PDF resources will fail extraction. The flow does not declare language restrictions, but chunking and embedding quality depend on the selected embedding model. The `title` acts as the configured primary key during indexing, so repeated runs with the same `title` will overwrite previous indexed records rather than create parallel duplicates.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | any | Raw output from `IndexNode_622`, representing the result of the vector indexing operation. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

The API response is a JSON object with a single top-level field, `status`. That field is a pass-through of whatever the configured vector database index node returns after attempting to write vectors and metadata. Its exact structure depends on the vector database connector and may include success indicators, write counts, record identifiers, or provider-specific status details.

## Dependencies
### Upstream Flows
This is a standalone entry-point flow in the Embedded Chat pipeline. No Lamatic flow is required to run before it.

The practical upstream dependency is the caller that invokes the flow by ID, typically the Next.js embedded chat application or an operator backend using the deployed Lamatic flow identifier exposed through `EMBEDDED_CHATBOT_PDF_INDEXATION`. That caller must supply the trigger data this flow consumes, specifically `title` and `url`.

### Downstream Flows
- `Embedded Chatbot - Chatbot` consumes the vectors and metadata written by this flow indirectly through the shared vector database. It depends on this flow having successfully indexed document chunks so retrieval can return relevant passages during question answering.
- `Embedded Chatbot - Resource Deletion` may later target the indexed resource for removal, typically using the metadata and primary-key conventions established during ingestion.

This flow’s direct API response only returns `status`, but its operationally important output is the side effect of persisted vectors in the configured `vectorDB`.

### External Services
- PDF file host — source location for the document binary consumed by `Extract from File` — requires the `url` provided at trigger time to be reachable
- Embedding model provider — generates vector embeddings for chunked text — requires a model selected in `embeddingModelName`
- Vector database — stores embeddings and metadata for later semantic retrieval — requires a configured `vectorDB` connection
- Lamatic GraphQL/API runtime — receives the API-triggered flow invocation and returns the flow response — requires Lamatic project API configuration in the calling application

### Environment Variables
- `EMBEDDED_CHATBOT_PDF_INDEXATION` — deployed flow ID used by the application to invoke this flow — used outside the flow by the caller that triggers `API Request`
- `LAMATIC_API_URL` — Lamatic API base URL for invoking deployed flows — used outside the flow by the application integrating with `API Request`
- `LAMATIC_PROJECT_ID` — Lamatic project identifier for authenticated flow execution — used outside the flow by the application integrating with `API Request`
- `LAMATIC_API_KEY` — Lamatic API credential for authenticated flow execution — used outside the flow by the application integrating with `API Request`

## Node Walkthrough
1. `API Request` (`graphqlNode`) receives the flow invocation. In this flow, the trigger is expected to provide at least `title` and `url`, where `url` points to the PDF to be ingested.
2. `Variables` (`variablesNode`) creates a small normalized metadata object for downstream use. It maps `title` from `{{triggerNode_1.output.title}}` and sets `source` to the constant value `Documentation`.
3. `Extract from File` (`extractFromFileNode`) downloads and parses the file referenced by `{{triggerNode_1.output.url}}` as a PDF. It is configured to join pages, so multi-page PDFs are treated as a single text stream for later processing.
4. `Extract Text` (`codeNode`) runs the referenced script `embedded-chatbot-pdf-indexation_extract-text.ts` against the extracted file output. Its role is to convert the parser output into plain text suitable for chunking.
5. `Chunking` (`chunkNode`) splits the extracted text into overlapping segments using recursive character chunking. In this flow, chunks are created at roughly `500` characters with `50` characters of overlap, using paragraph, line, and space separators to preserve readability where possible.
6. `Get Chunks` (`codeNode`) runs the script `embedded-chatbot-pdf-indexation_get-chunks.ts` to reshape or extract the chunk list from the chunking node output into the text array expected by the embedding step.
7. `Vectorize` (`vectorizeNode`) converts the prepared chunks from `{{codeNode_254.output}}` into embeddings using the selected `embeddingModelName`. Its output includes the vector array later sent for indexing.
8. `Transform Metadata` (`codeNode`) runs the script `embedded-chatbot-pdf-indexation_transform-metadata.ts` to build the metadata payload aligned with the vectors. This step is where the earlier normalized values such as `title` and `source` are prepared into the structure expected by the indexer.
9. `Index` (`IndexNode`) writes the generated vectors from `{{vectorizeNode_639.output.vectors}}` and metadata from `{{codeNode_507.output.metadata}}` into the configured `vectorDB`. It uses `title` as the primary key and applies `overwrite` behavior when duplicates are encountered.
10. `API Response` (`graphqlResponseNode`) returns a JSON response with `status` mapped from `{{IndexNode_622.output}}`, exposing the final indexing result to the caller.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails before extraction starts | The trigger payload is missing `url` or `title` | Ensure the caller sends both required fields and that field names exactly match the trigger mapping. |
| Extraction returns no useful content | The `url` does not point to a valid PDF, the file is inaccessible, or the PDF contains little extractable text | Verify the URL is reachable, points to a PDF, and is not protected by expired or missing access credentials. Test the document manually. |
| Chunking produces empty or unusable chunks | The text extraction script returned empty output or malformed data | Inspect the output of `Extract from File` and the `Extract Text` script behavior; confirm the PDF contains parseable text rather than only scanned images. |
| Embedding step fails | No `embeddingModelName` was configured or the selected embedding provider is unavailable | Configure a valid embedding model input for `vectorizeNode_639` and verify provider access in Lamatic. |
| Indexing step fails | No `vectorDB` was configured, the connector is invalid, or the metadata/vector shapes do not match | Select a valid vector database in `IndexNode_622` and verify the metadata transformation script produces one metadata record per vector. |
| Existing document seems to disappear after re-indexing | Duplicate handling is set to `overwrite` and the same `title` was reused | Use unique titles where distinct records are required, or intentionally reuse `title` only when replacing a prior version. |
| Chat flow cannot find the newly uploaded document later | This ingestion flow failed silently upstream, indexed into the wrong database, or the chat flow is pointed at a different vector store | Confirm this flow completed successfully, that `status` indicates a successful write, and that the chat flow uses the same vector database/index. |
| Invocation from the application fails before the flow runs | Lamatic API credentials or flow ID are missing in the application environment | Set `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and `EMBEDDED_CHATBOT_PDF_INDEXATION` correctly in the invoking app. |

## Notes
- The flow’s only direct response field is `status`; the real business outcome is the side effect of indexed vectors in the vector database.
- The configured chunking strategy is character-based rather than token-based. For very large or highly structured PDFs, retrieval quality may improve if chunk sizing is tuned for the chosen embedding model.
- PDFs that are image-only scans may not extract cleanly unless the underlying file parser or script adds OCR capabilities; none are explicit in this flow definition.
- Metadata includes a fixed `source` value of `Documentation`, which is useful for downstream filtering but does not distinguish among multiple PDF subtypes unless the scripts add more fields.
- Because `title` is the sole declared primary key, title collisions are operationally significant. Choose stable, unique titles if multiple similarly named documents may coexist.