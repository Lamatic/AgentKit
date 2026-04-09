# Sharepoint
A flow that ingests documents from a SharePoint site, converts them into vector-searchable chunks, and maintains the internal knowledge index used by the wider Deep Research system.

## Purpose
This flow is responsible for indexation of SharePoint content so that internal documents can participate in retrieval during research runs. Rather than answering user questions directly, it connects to a configured SharePoint site, reads supported files, breaks their contents into manageable chunks, generates embeddings, attaches retrieval-friendly metadata, and writes the resulting records into a vector database.

The outcome is a searchable internal corpus derived from SharePoint Business documents. That matters because the broader agent pipeline depends on a reliable internal index when it needs to ground answers in organization-owned content instead of relying only on public web data. Without this flow, SharePoint documents remain invisible to downstream retrieval flows.

In the larger plan-retrieve-synthesize architecture described by the parent agent, this flow sits in the indexing layer rather than the runtime reasoning layer. Operators run it ahead of time or on a schedule to prepare internal knowledge. Downstream retrieval flows can then query the vector database populated here as part of evidence gathering before the final synthesis flow produces a user-facing answer.

## When To Use
- Use when your organization stores reference material, policies, reports, presentations, or notes in SharePoint and wants those documents available for semantic retrieval.
- Use when setting up or refreshing the internal knowledge base that supports Deep Research over enterprise content.
- Use when a SharePoint site has new or updated files and the vector index must be synchronized incrementally.
- Use when you need recurring ingestion of supported file types from a SharePoint Business site into a configured vector database.
- Use before running any internal-data retrieval flow that expects SharePoint-derived vectors to already exist.

## When Not To Use
- Do not use when the source content lives somewhere other than SharePoint; use the sibling indexation flow for the correct connector such as Google Drive, OneDrive, S3, or Postgres.
- Do not use when the goal is to answer a user query directly; this flow prepares data and does not return a synthesized answer.
- Do not use when SharePoint credentials have not been configured or the target site URL is unknown or inaccessible.
- Do not use when no vector database destination has been selected, because embeddings produced by this flow are meant to be indexed rather than returned as a final artifact.
- Do not use for unsupported file types outside the configured glob set of `pdf`, `docx`, `txt`, `pptx`, and `md`.
- Do not use if you need ad hoc public-web retrieval; that belongs to the web-search branch of the broader kit.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | credential selector | Yes | Authentication used by the SharePoint connector. The description references OneDrive authentication, but in this flow it is used to access SharePoint Business content. |
| `site_url` | resource locator | Yes | Target SharePoint site to ingest from. Can be selected from a discovered list or entered directly as a URL such as `https://lamatic.sharepoint.com/sites/test`. |
| `embeddingModelName` | model selector | Yes | Text embedding model used to convert chunked document text into vectors. Must be a model compatible with `embedder/text`. |
| `vectorDB` | database selector | Yes | Destination vector database where embeddings and metadata will be indexed. |

Below the table, describe any notable input constraints or validation assumptions (e.g. max length, expected format, language).

The `site_url` must identify a valid SharePoint site and is expected to be reachable with the selected `credentials`. The trigger is configured to scan from `folder_path` `.` with `search_scope` set to `ALL`, so the practical ingestion scope is the whole configured site unless the connector itself narrows it. Only files matching the configured glob patterns are considered: `**/*.pdf`, `**/*.docx`, `**/*.txt`, `**/*.pptx`, and `**/*.md`. The flow assumes the selected embedding model can process the chunk sizes produced here and that the chosen vector database supports overwrite semantics on duplicate primary keys.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | implementation-defined | Result of the final indexing operation, typically indicating whether records were written to the vector store successfully. |
| `indexed_records` | implementation-defined | Count or summary of vectors/documents indexed, if exposed by the runtime for the `Index` node. |
| `metadata` | implementation-defined | Indexed metadata payload associated with the written vectors, if surfaced by the platform execution result. |

Below the table, describe the output format in plain English — e.g. whether it is a list, a prose paragraph, a structured object — and any caveats about completeness or truncation.

This flow is an ingestion pipeline, not a response-generation pipeline, so its useful output is the side effect of writing vectors and metadata into the configured vector database. In practice, callers should treat the result as an indexing job outcome rather than a user-facing payload. The exact response fields depend on how Lamatic exposes the terminal `Index` node result at execution time, but the canonical artifact produced by this flow is the persisted vector index itself.

## Dependencies
### Upstream Flows
- This is a standalone indexation flow and does not require another flow in this kit to run before it.
- Operationally, it depends on SharePoint source content already existing and being accessible through the configured `credentials` and `site_url`.
- In the broader system, it is part of the pre-retrieval preparation layer described in the parent agent: it builds internal knowledge that later retrieval flows depend on.

### Downstream Flows
- Internal data-source retrieval flows in the Deep Research kit consume the vector database populated by this flow.
- Those retrieval flows depend on the vectors written from `{{vectorizeNode_639.output.vectors}}` and the metadata assembled from `{{codeNode_507.output.metadata}}`, even though they query them indirectly through the vector store rather than by direct flow-to-flow field passing.
- The final synthesis flow can benefit from this flow indirectly because retrieval results grounded in SharePoint content may be included in the research context it synthesizes.

### External Services
- SharePoint Business connector — reads documents from the configured SharePoint site — required credential: `credentials`
- Embedding model provider — converts chunked text into vector representations — required configuration: `embeddingModelName`
- Vector database — stores embeddings plus metadata for later semantic retrieval — required configuration: `vectorDB`
- Lamatic script runtime — executes custom transformation logic in `Get Chunks` and `Transform Metadata` — required asset references: `@scripts/sharepoint_get-chunks.ts` and `@scripts/sharepoint_transform-metadata.ts`

### Environment Variables
- No flow-specific environment variables are declared in the flow source.
- Platform-level Lamatic credentials and project settings may still be required by the deployment environment, but no node in this flow references a named environment variable directly.

## Node Walkthrough
1. `Sharepoint Business` (`triggerNode`)
   - This trigger connects to SharePoint Business using the selected `credentials` and `site_url`.
   - It scans the site incrementally using `syncMode` set to `incremental`.
   - The connector is configured to include files matching `**/*.pdf`, `**/*.docx`, `**/*.txt`, `**/*.pptx`, and `**/*.md`.
   - For each matching document, it emits core fields including the raw `content` plus source attributes such as `document_key`, `_ab_source_file_last_modified`, and `_ab_source_file_url`.

2. `Variables` (`variablesNode`)
   - This node maps selected trigger outputs into a normalized metadata shape used later in the pipeline.
   - It creates `title` from `{{triggerNode_1.output.document_key}}`.
   - It creates `last_modified` from `{{triggerNode_1.output._ab_source_file_last_modified}}`.
   - It creates `source` from `{{triggerNode_1.output._ab_source_file_url}}`.
   - This keeps important provenance fields available as the flow transforms the document content into chunks and vectors.

3. `Chunking` (`dynamicNode`)
   - This node takes `{{triggerNode_1.output.content}}` and splits it into smaller pieces suitable for embedding.
   - It uses recursive character splitting with `numOfChars` set to `500` and `overlapChars` set to `50`.
   - The separator priority is paragraph break, newline, then space, which aims to preserve semantic coherence while still enforcing chunk size.
   - The result is an ordered set of overlapping text chunks derived from each source document.

4. `Get Chunks` (`codeNode`)
   - This custom script, referenced as `@scripts/sharepoint_get-chunks.ts`, reshapes the chunker output into the exact text array expected by the embedding step.
   - Its role is flow-specific glue logic: it takes the chunked output and prepares the payload consumed by `Vectorize` as `inputText`.
   - Because this step is script-driven, it is also where chunk structures can be flattened or normalized before vector generation.

5. `Vectorize` (`dynamicNode`)
   - This node sends `{{codeNode_254.output}}` to the selected embedding model.
   - It generates vector embeddings for every prepared chunk.
   - The resulting vectors are exposed as `{{vectorizeNode_639.output.vectors}}` for the indexing step.

6. `Transform Metadata` (`codeNode`)
   - This custom script, referenced as `@scripts/sharepoint_transform-metadata.ts`, assembles the metadata payload that will travel alongside the vectors into the vector database.
   - It likely combines the normalized provenance fields from earlier in the flow with chunk-level or document-level attributes so retrieval results remain interpretable.
   - The output is consumed as `{{codeNode_507.output.metadata}}` by the final indexing node.

7. `Index` (`dynamicNode`)
   - This node writes the generated vectors and transformed metadata into the selected `vectorDB`.
   - It uses `file_name` as the configured primary key.
   - Duplicate handling is set to `overwrite`, so if a record with the same primary key already exists, the new version replaces the old one.
   - This is the step that materializes SharePoint content as searchable internal knowledge for downstream retrieval.

8. `addNode` (`addNode`)
   - This is only a canvas placeholder for future extension and does not contribute runtime behavior to the current flow.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Authentication failure when the flow starts | `credentials` are missing, expired, or do not grant access to the SharePoint site | Reconfigure the credential selection, confirm the account has permission to the target site, and re-run the flow |
| No files are indexed even though the site exists | The site has no files matching the configured glob patterns, the files are outside the accessible scope, or incremental sync finds no new changes | Verify supported file types are present, confirm connector visibility into the site, and if needed trigger a broader refresh or update source files |
| Invalid or unreachable `site_url` | The SharePoint site URL is malformed, points to the wrong site, or is not accessible with the chosen credentials | Use the list-based site selector when possible, validate the URL format, and confirm the site opens under the same identity used by the connector |
| Embedding step fails | `embeddingModelName` is unset, incompatible, unavailable, or exceeds provider limits for the prepared text chunks | Select a valid text embedding model, verify model availability in the project, and reduce chunk size only if your provider requires smaller inputs |
| Indexing step fails | `vectorDB` is not selected, is misconfigured, or rejects the metadata/vector payload | Confirm the vector database connection is configured in Lamatic, ensure the destination is healthy, and verify it supports the expected schema and overwrite behavior |
| Duplicate or unexpected overwrite behavior | Multiple documents collapse onto the same configured primary key `file_name` | Review primary key strategy and ensure the metadata transformation preserves a uniquely identifying file name or path where needed |
| Metadata is missing or malformed in retrieval results | The `Transform Metadata` script does not emit the structure expected by the `Index` node or downstream retrieval logic | Inspect and correct `@scripts/sharepoint_transform-metadata.ts`, then re-index affected documents |
| Chunks are poor quality or retrieval relevance is low | Chunk size, overlap, or chunk extraction script behavior is not well matched to the document corpus | Tune chunking settings and review `@scripts/sharepoint_get-chunks.ts` to ensure clean chunk boundaries and complete text coverage |
| A downstream retrieval flow returns nothing from SharePoint content | This indexing flow has not run yet, has not completed successfully, or wrote into a different vector database than the retrieval flow queries | Run or rerun this flow, confirm successful indexation, and verify that retrieval points to the same vector store |

## Notes
- The trigger is configured for incremental synchronization, which is appropriate for ongoing maintenance of an index but means unchanged historical files may not be reprocessed on every run.
- The flow hardcodes a weekly cron expression value in the trigger configuration, but actual scheduling depends on how the flow is deployed and activated in Lamatic.
- The connector description mentions OneDrive authentication even though the flow is clearly targeting SharePoint Business; operators should treat the credential as the Microsoft identity used to access SharePoint.
- The `Index` node uses `file_name` as the sole primary key. If files with identical names exist across different folders or libraries, **overwrite collisions are possible** unless the metadata transformation or connector behavior ensures uniqueness.
- Two custom scripts are central to the final data shape. If you customize this flow, review those scripts first because they define how chunk outputs and metadata are normalized before indexing.