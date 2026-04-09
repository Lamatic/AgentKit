# 3. Embedded Search - Resource Deletion
A lifecycle-management flow that removes previously indexed PDF or website resources from the embedded search vector store and returns an API-friendly deletion status for the wider Embedded Search system.

## Purpose
This flow is responsible for deleting content that has already been ingested into the Embedded Search vector database. In this kit, indexed resources are not static: operators may need to remove outdated PDFs, decommissioned web pages, test data, or content that should no longer be searchable for compliance, accuracy, or cost reasons. This flow handles that cleanup task by routing the request based on resource type and issuing vector-database deletions against the metadata used during ingestion.

The outcome is a targeted removal of vector records associated with a single indexed resource. For PDFs, deletion is performed by matching the indexed `title`. For websites, deletion is performed across the provided `urls`, deleting entries whose `source` metadata matches each URL. After execution, the flow returns a compact status payload suitable for API consumers and operational tooling.

Within the broader Embedded Search pipeline, this flow sits on the content-lifecycle management side rather than the retrieval path itself. The kit’s indexation flows create searchable vectors, the search flow retrieves from them, and this deletion flow removes them when they should no longer participate in retrieval. In plan-ingest-retrieve-manage terms, this is the manage and cleanup stage that keeps the search corpus accurate and governable.

## When To Use
- Use when an indexed PDF should be removed from search results and its stored vectors should be deleted by matching its `title`.
- Use when one or more indexed website URLs should be removed from the vector store by matching each URL against the stored `source` metadata.
- Use when content has changed materially and you want to delete stale indexed entries before re-indexing fresh content.
- Use when an operator, admin UI, or backend workflow needs an API-callable deletion endpoint for embedded search resources.
- Use when compliance, retention, or customer-request workflows require indexed content to be purged from the search corpus.
- Use when cleaning up test or accidental ingestion data from the configured vector database.

## When Not To Use
- Do not use this flow to add new PDFs or websites to the search index; use the PDF or website indexation flows instead.
- Do not use this flow to execute user search queries; the dedicated search flow handles retrieval.
- Do not use this flow if the resource was never indexed into the selected vector database, because there may be nothing meaningful to delete.
- Do not use this flow with a `type` other than `pdf` or a website-style payload with `urls`; the branch logic only explicitly handles `pdf`, and all other values fall into the website-style path.
- Do not use this flow if you cannot supply the same identifying metadata used during indexing, especially the PDF `title` or website `urls` that map to stored `source` fields.
- Do not use this flow before the vector database connector has been configured, because both deletion branches depend on a selected `vectorDB` input.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes for PDF deletion; otherwise context-dependent | Human-readable resource title used as the deletion key for the `pdf` branch. The flow deletes vector records whose metadata field `title` equals this value. |
| `type` | `string` | Yes | Resource type selector used by the condition node. A value of `pdf` routes to PDF deletion; any other value routes to the website-style deletion path. |
| `urls` | `string[]` | Yes for website deletion; otherwise not used | List of website URLs to delete. The flow iterates over the list and deletes vector records whose metadata field `source` equals each URL. |
| `vectorDB` | `select` / database connector | Yes | Private runtime configuration selecting the vector database against which deletion operations will be executed. This must be configured for both vector deletion nodes. |

Below the table, the most important constraint is that the deletion keys must match the metadata written during ingestion. For PDFs, `title` must align with the stored `title` metadata. For websites, each entry in `urls` must align with the stored `source` metadata for indexed chunks. The trigger schema is not explicitly declared in the flow source, so callers should send a JSON payload containing at least `type` and the branch-specific identifier fields. Any non-`pdf` `type` is treated as the website path, so malformed or unexpected type values can route incorrectly.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `object` or `string` | Final deletion status returned from the `Finalise Output` code node and exposed as the API response body under `status`. |

Below the table, the API response is a JSON object with a single top-level field, `status`, whose value is whatever the `Finalise Output` script returns. Based on the flow structure, this is intended to be a compact, structured deletion result rather than a large dataset. The exact shape is defined by the referenced script, but the response wrapper itself is fixed: `{"status": ...}`.

## Dependencies
### Upstream Flows
- This is not a direct continuation step invoked by another Lamatic flow in the graph; it is an API-triggered entry-point flow.
- Operationally, it depends on one of the ingestion flows having run earlier in the content lifecycle so there is something to delete:
  - `1A. Embedded Search - PDF Indexation` must previously have indexed PDF chunks into the same vector database with metadata that includes `title`.
  - The website indexation flow must previously have indexed website chunks into the same vector database with metadata that includes `source` values matching the original URLs.
- This flow consumes no explicit output object from those flows at runtime, but it relies on their earlier side effects in the vector store and on callers supplying the same identifying fields those flows used when writing metadata.

### Downstream Flows
- No downstream Lamatic flow is shown as consuming this flow’s output.
- In the broader kit, the practical downstream effect is on the search flow: once deletion succeeds, future retrieval should no longer return the removed vectors.
- External applications or operator tooling may consume the returned `status` field to confirm deletion, trigger re-indexing, or update their own resource records.

### External Services
- Vector database connector — executes deletion operations against indexed embeddings and metadata — required credential or environment variable depends on the selected Lamatic vector database integration
- Lamatic GraphQL/API trigger layer — receives the inbound API request and returns the response — requires the deployment-specific Lamatic API configuration used by the host application
- Referenced code scripts — normalize branch results into a final status payload and possibly prepare website deletion summaries — no separate credential, but they are internal dependencies of the flow package

### Environment Variables
- `LAMATIC_API_URL` — base Lamatic API endpoint used by the calling application to invoke the deployed flow — used outside the graph at the API invocation boundary for `API Request`
- `LAMATIC_PROJECT_ID` — Lamatic project identifier used by the calling application to target the deployed flow — used outside the graph at the API invocation boundary for `API Request`
- `LAMATIC_API_KEY` — authentication for invoking the deployed flow from the application or operator tooling — used outside the graph at the API invocation boundary for `API Request`
- Flow-specific endpoint binding for `EMBEDDED_SEARCH_RESOURCE_DELETION` — deployment/config reference used by the host app to address this flow — used at the application integration layer for `API Request`
- Vector database provider credentials — authentication and connection details for the selected `vectorDB` integration — used by both `VectorDB` nodes, `vectorNode_537` and `vectorNode_493`

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the deletion request over Lamatic’s API/GraphQL layer. The payload is expected to include a resource `type` and the identifying fields needed for the chosen branch, plus a configured `vectorDB` connector at runtime.

2. `Condition` (`conditionNode`) inspects `triggerNode_1.output.type` and checks whether it equals `pdf`. This is the flow’s branch point: exact `pdf` values take the PDF deletion path, while every other value falls through to the website-style deletion branch.

3. `VectorDB` (`vectorNode_537`) runs only on the `pdf` branch. It issues a delete action against the selected vector database with a metadata filter matching `title == {{triggerNode_1.output.title}}`. This removes up to the configured limit of matching vector records for that PDF resource.

4. `Loop` (`forLoopNode_399`) runs only on the non-`pdf` branch. It iterates over `triggerNode_1.output.urls`, treating the incoming list of URLs as the set of website resources to delete.

5. `VectorDB` (`vectorNode_493`) executes inside the loop for each URL. For every `currentValue` in `urls`, it issues a delete action against the selected vector database with a metadata filter matching `source == {{forLoopNode_399.output.currentValue}}`. This removes up to the configured limit of matching vector records for that specific URL.

6. `Loop End` (`forLoopEndNode_451`) closes the website deletion loop and advances execution only after all URL-specific delete operations have been attempted.

7. `Code` (`codeNode_571`) runs after the website loop completes. It uses the referenced script `@scripts/embedded-search-resource-deletion_code.ts` to transform or summarize the loop branch result into a form suitable for final output handling.

8. `Finalise Output` (`codeNode_690`) runs for both branches. On the PDF path, it receives control directly after the vector deletion node. On the website path, it receives the processed result from `Code`. It uses `@scripts/embedded-search-resource-deletion_finalise-output.ts` to produce the canonical final status payload.

9. `API Response` (`responseNode`) returns a JSON response with `content-type: application/json`, mapping the final payload to a single field: `status: {{codeNode_690.output}}`.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Flow fails before deletion begins | `vectorDB` connector was not configured for one or both `VectorDB` nodes | Configure the required vector database input in the deployed flow and ensure the selected integration has valid credentials |
| API returns a success-shaped response but nothing is actually removed | The provided `title` or `urls` do not exactly match the metadata values stored during ingestion | Inspect how the ingestion flows wrote metadata, then resend the deletion request using the exact stored `title` or `source` values |
| Website deletion branch runs unexpectedly | `type` was missing, misspelled, or set to a value other than exact `pdf` | Validate the request payload and send `type: "pdf"` for PDF deletion; use the website branch only when `urls` are present |
| Website deletion does nothing | `urls` is empty, missing, or contains malformed entries | Provide a non-empty array of valid URL strings and confirm those URLs were used as `source` metadata during indexing |
| PDF deletion does nothing | `title` is missing or does not correspond to the indexed PDF metadata | Provide the exact indexed PDF title or adjust the deletion strategy if ingestion used a different unique identifier |
| Only some records are removed | The vector delete nodes are configured with a `limit` of `20`, so more than 20 matching chunks may remain | Increase the delete limit in the flow configuration or ensure resources are indexed with identifiers that allow complete, bounded deletion |
| Search still returns deleted content | Search is reading from a different vector database, deletion targeted the wrong connector, or deletion was partial due to limit/filter mismatch | Confirm the same `vectorDB` is used across ingestion, search, and deletion, then verify filters and rerun cleanup if needed |
| Invocation from the host app fails | Lamatic API configuration such as `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, or flow binding is missing or incorrect | Recheck deployment keys in the application environment and confirm the app is calling the correct deployed flow endpoint |
| Nothing can be deleted for an apparently valid request | The upstream ingestion flow never ran for this resource, or it wrote to a different project/environment | Verify that the resource was indexed previously in the same Lamatic environment and vector store before calling deletion |

## Notes
- The flow has no explicit trigger schema enforcement in the source shown, so callers should validate payload shape in the application layer before invocation.
- The branch condition is intentionally narrow: only exact `pdf` values hit the PDF path. All other values are treated as website-style requests.
- Both delete operations filter on metadata fields rather than primary keys. This is convenient but makes correctness dependent on consistent metadata design during ingestion.
- Each `VectorDB` delete node is configured with `limit: 20`. If a single resource was chunked into more than 20 vector records, a single run may not fully purge it.
- The `description`, `githubUrl`, `documentationUrl`, and `deployUrl` metadata fields are empty in the flow source, so operational documentation should treat this file as the primary reference for behavior.