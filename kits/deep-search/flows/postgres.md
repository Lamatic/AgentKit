# Postgres
This flow incrementally extracts rows from a Postgres table or view, transforms them into chunked text embeddings, and indexes them into a vector database for downstream internal retrieval in the wider Deep Research system.

## Purpose
This flow is responsible for turning structured data stored in Postgres into searchable vectorized knowledge. It solves the indexing side of the overall system rather than the answering side: it connects to a chosen Postgres source, reads from a configured schema and table or view, converts each row into chunkable text, generates embeddings, attaches metadata, and writes the result into a vector database. That makes relational data available to retrieval flows that need semantically searchable internal context.

The outcome of this flow is an updated vector index containing embedded representations of Postgres content along with metadata needed for retrieval and traceability. This matters because the broader Deep Research agent relies on internal indexes to ground answers in organization-specific data. Without this indexing step, internal search flows have no Postgres-backed corpus to query.

Within the broader pipeline described by the parent agent, this flow sits in the knowledge ingestion and maintenance layer that supports the retrieve stage. It does not plan user work or synthesize final answers. Instead, operators run it on a schedule or on demand so that downstream retrieval flows can search over current Postgres-derived content during research runs.

## When To Use
- Use when you need to index data from a Postgres database into a vector store for semantic retrieval.
- Use when a team has organization data in a Postgres table or view that should become searchable by downstream internal search flows.
- Use when you want recurring ingestion from Postgres, since the trigger is configured for scheduled execution with incremental append sync mode.
- Use when a schema and specific table or view have been identified as the source of truth for content to index.
- Use when the vector database connection and embedding model have already been configured and you want to refresh or extend the searchable corpus.

## When Not To Use
- Do not use when the source data is not in Postgres; use the sibling indexation flow for the actual source system such as Google Drive, SharePoint, S3, or another supported connector.
- Do not use when the objective is to answer a user research query directly; the reasoning and synthesis flows handle planning, retrieval, and final response generation.
- Do not use when Postgres credentials, schema access, or table selection are not available, because the trigger cannot extract source rows without them.
- Do not use when no vector database has been configured, since the flow’s final purpose is indexing and it cannot complete without a target vector store.
- Do not use when an embedding model is not selected, because vector generation is mandatory in this pipeline.
- Do not use for ad hoc raw SQL exploration or transactional database operations; this flow is for ingestion and indexing, not general Postgres querying.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `credentials` | `select` | Yes | Postgres authentication credentials used by the trigger to connect to the source database. |
| `schemas` | `select` | Yes | Source schema from which the table or view will be read. |
| `tables` | `select` | Yes | Source table or view selected for batch indexing. |
| `mapping` | `variablesInput` | Yes | Variable mapping used during transformation, with expected keys `title` and `source`. |
| `embeddingModelName` | `model` | Yes | Embedding model used to convert chunked row text into vector representations. |
| `vectorDB` | `select` | Yes | Target vector database where embeddings and metadata will be indexed. |

The trigger-facing source configuration assumes valid Postgres credentials and a selectable schema and streamable table or view. The `mapping` input is expected to include at least `title` and `source`; by default these are mapped to `table_name` and `postgres`. The selected embedding model must be compatible with text embedding generation, and the selected vector database must support the index node used by this flow.

## Outputs
| Field | Type | Description |
|---|---|---|
| `indexingResult` | `object` | Conceptual result of the final indexing step, indicating that vectors and metadata were written to the target vector database. |

The flow is designed as an ingestion pipeline rather than a rich response API. Its practical output is the side effect of records being indexed into the configured vector store. Any returned payload is expected to be an operational status or connector result from the indexing node rather than a user-facing document. Developers should treat the vector database as the authoritative output destination.

## Dependencies
### Upstream Flows
- This is not dependent on another flow in the reasoning chain. It is an ingestion and maintenance flow that can be run as a standalone scheduled or operator-initiated process.
- Operationally, it does depend on prior setup outside the flow: Postgres credentials must exist, a target vector database must be configured, and an embedding model must be available.

### Downstream Flows
- Internal retrieval flows in the broader Deep Research kit depend on the vectorized corpus produced here. They consume the indexed embeddings and metadata indirectly through the shared vector database rather than through a direct API field from this flow.
- The final synthesis flow may ultimately benefit from this flow’s output, but only through intermediate retrieval flows that query the vector store for relevant context.

### External Services
- Postgres — source relational database used for incremental extraction of rows from the selected schema and table or view — required credential: configured `credentials` input on `triggerNode_1`
- Embedding model provider — generates vector embeddings from chunked row text — required configuration: selected `embeddingModelName` on `vectorizeNode_177`
- Vector database — stores vectors and metadata for later semantic search — required configuration: selected `vectorDB` input on `IndexNode_824`
- Lamatic script runtime — executes custom transformation logic for row chunking and metadata shaping — required asset references: `@scripts/postgres_row-chunking.ts` and `@scripts/postgres_transform-metadata.ts`

### Environment Variables
- No flow-specific environment variables are declared in the flow source.
- Platform-level Lamatic credentials and project settings may still be required by the hosting environment, but they are not referenced directly by any node in this flow.

## Node Walkthrough
1. `Postgres` (`triggerNode`) starts the flow by connecting to the configured Postgres source using the selected `credentials`, `schemas`, and `tables`. It is configured with `syncMode` set to `incremental_append`, so its intended behavior is recurring ingestion that appends newly available source data rather than full replacement on every run. The trigger also carries a daily cron expression, indicating this flow is meant to refresh the index on a schedule.

2. `Variables` (`variablesNode`) prepares transformation context for downstream scripting. It accepts the `mapping` input and, by default, maps `title` to `table_name` and `source` to `postgres`. These values are used to standardize metadata fields derived from the source rows so the indexed records are labeled consistently.

3. `Row Chunking` (`codeNode`) runs the custom script referenced by `@scripts/postgres_row-chunking.ts`. This step takes the extracted Postgres data together with the variable mapping and converts row content into text suitable for embedding. In practice, this is the stage where structured row data is flattened, normalized, and segmented into chunked textual units. Its output is passed forward as `{{codeNode_331.output}}` to the embedding node.

4. `Vectorise` (`dynamicNode`) sends the chunked text to the selected embedding model via the `embeddingModelName` input. It converts the chunked row text into vector representations that can be stored in a semantic index. This node depends on the previous chunking step producing embed-ready text.

5. `Transform Metadata` (`codeNode`) runs the custom script referenced by `@scripts/postgres_transform-metadata.ts`. This step combines the embedding output with source-derived information and shapes the final payload expected by the indexer. The flow explicitly reads `{{codeNode_443.output.vectors}}` and `{{codeNode_443.output.metadata}}` from this node, so this script is responsible for assembling both the vector array and the aligned metadata objects.

6. `Index to DB` (`dynamicNode`) writes the transformed vectors and metadata into the selected vector database. It uses `vectorsField` from `Transform Metadata` and `metadataField` from the same node. The `primaryKeys` are set to `title` and `content`, and `duplicateOperation` is `overwrite`, which means records resolving to the same primary identity are intended to replace prior indexed versions rather than coexist as duplicates.

7. The trailing `addNode` is a canvas placeholder and does not contribute operational behavior to the execution path.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails at startup or cannot read source data | Missing or invalid `credentials` for Postgres | Reconfigure the `credentials` input with a valid Postgres connection that has access to the selected schema and table or view. |
| Schema dropdown or table selection is empty | Credential permissions do not allow discovery, or the selected database has no accessible schemas or tables | Verify the database user permissions, then reselect `schemas` and `tables` after confirming the source objects exist. |
| Flow runs but indexes nothing | Selected table or view returned no new rows under incremental append behavior | Confirm the source contains data eligible for incremental ingestion, or adjust operational expectations if no new rows were added since the last run. |
| Failure in `Row Chunking` | Malformed source rows or mapping assumptions do not match the actual table structure | Review the source table shape and update the `mapping` input or the row-chunking script so expected fields can be derived reliably. |
| Failure in `Vectorise` | No `embeddingModelName` selected or selected model is unavailable | Choose a valid text embedding model and confirm provider access in the environment. |
| Failure in `Transform Metadata` | The metadata script expected fields that were not produced upstream | Inspect the chunking and embedding outputs and align the metadata transformation logic with the actual payload shape. |
| Indexing step fails | No `vectorDB` selected, vector store connection is invalid, or payload shape does not match index expectations | Select a valid vector database, verify connectivity, and confirm the metadata transform script produces correctly aligned `vectors` and `metadata`. |
| Existing indexed records are unexpectedly replaced | `duplicateOperation` is set to `overwrite` and primary identity collided | Review `primaryKeys` behavior and ensure `title` plus `content` is the intended uniqueness strategy for this dataset. |
| Downstream retrieval flow finds no Postgres content | This indexing flow has not run successfully, or it indexed into the wrong vector database | Run this flow successfully, verify target `vectorDB`, and confirm the retrieval flow queries the same index. |
| Trigger configuration appears valid but data is incomplete | Upstream setup outside the flow, such as source permissions or connector configuration, was never completed | Validate operational prerequisites in Lamatic before rerunning the flow. |

## Notes
- This flow’s core value is in the indexed side effect, not in a rich return payload. Operational monitoring should focus on source extraction success, embedding generation, and vector write completion.
- Because `duplicateOperation` is `overwrite`, re-indexing is safe for updates but can also mask repeated ingestion issues by replacing prior records silently.
- The default variable mapping sets `source` to `postgres`, which is useful for downstream filtering when multiple ingestion flows feed the same vector database.
- The actual chunking and metadata semantics are implemented in external scripts. If the source schema changes, those scripts are the first place to inspect.
- A `webhookURL` is present in the index node configuration, but the flow wiring does not expose it as a meaningful public output contract. Treat the vector database write as the primary outcome.