# 3. Embedded Chatbot - Resource Deletion
A maintenance flow that removes previously indexed PDF or website resources from the embedded chat vector store so outdated or unwanted content no longer participates in retrieval and chat responses.

## Purpose
This flow is responsible for the delete side of the embedded chat content lifecycle. In the wider kit, separate indexation flows add PDF documents and website content to a vector database so the chatbot can retrieve grounded context at answer time. This flow performs the inverse operation: it identifies vectors associated with a resource and deletes them based on metadata derived from the incoming request.

The flow supports two deletion patterns. For PDF resources, it deletes vectors whose metadata `title` matches the provided `title`. For website resources, it iterates through the provided `urls` array and deletes vectors whose metadata `source` matches each URL. This outcome matters because the retrieval layer must reflect the current approved knowledge set; if stale, duplicated, or non-compliant content remains indexed, the chat flow can continue surfacing it in answers.

Within the broader agent pipeline described by the parent agent, this flow sits in the operational maintenance phase after ingestion and alongside chat. It is not part of the plan-retrieve-synthesize path used to answer end-user questions directly. Instead, it manages the integrity of the retrieval corpus that those downstream chat interactions depend on, closing the lifecycle loop of ingest, answer, and maintain.

## When To Use
- Use when an indexed PDF should be removed from the embedded chatbot knowledge base and the request can identify it by `title` with `type` set to `pdf`.
- Use when one or more indexed website pages should be removed from the knowledge base and the request provides `type` set to a non-`pdf` value plus a `urls` array.
- Use when content has become outdated, incorrect, duplicated, or should no longer be available for retrieval.
- Use when compliance, privacy, or governance requirements require specific resources to be withdrawn from the vector index.
- Use when an operator UI, admin backend, or automation needs to keep the chatbot’s retrievable corpus aligned with currently approved resources.

## When Not To Use
- Do not use to add new PDFs or webpages to the chatbot index; the PDF and website indexation sibling flows handle ingestion.
- Do not use to answer user questions; the chatbot flow is the correct retrieval-and-generation path for that.
- Do not use when the target vector database has not been configured on both deletion nodes, because the flow cannot perform any delete action without a selected `vectorDB`.
- Do not use for PDF deletion requests that lack a valid `title`, because the PDF branch deletes by metadata `title` equality.
- Do not use for website deletion requests that lack a usable `urls` array, because the website branch iterates over URLs and deletes by metadata `source` equality.
- Do not use when the resource was never indexed into the configured vector database; the flow may complete but remove nothing.
- Do not rely on this flow to remove auxiliary metadata records outside the vector store unless the referenced custom code explicitly implements that behavior in your deployment.

## Inputs
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | Yes for PDF deletion; otherwise conditionally used | Human-readable resource title. In the PDF branch, this is the key used to match vectors where metadata `title` equals the provided value. |
| `type` | `string` | Yes | Resource classification used by the condition node. If the value is exactly `pdf`, the flow executes the PDF deletion branch; all other values fall through to the website-style branch. |
| `urls` | `string[]` | Yes for website deletion; not used for PDF deletion | List of website URLs to remove. The flow loops over the array and deletes vectors whose metadata `source` matches each URL exactly. |

Below the table, notable constraints and assumptions:
- The trigger is an API request node with no explicit schema enforced in the flow source, so callers must supply correctly shaped payloads.
- The branch condition is a strict equality check against `pdf`. Values such as `PDF`, `application/pdf`, or `document` will not enter the PDF branch unless normalized before invocation.
- Website deletion assumes `urls` is an iterable list. If it is missing, empty, or not an array, the loop branch may do nothing or fail depending on runtime behavior.
- Matching is metadata-based and appears to require exact equality on `title` for PDFs and `source` for websites. Variants, redirects, trailing slashes, or inconsistent title formatting may prevent deletion.
- Both vector deletion nodes are configured with a `limit` of `20`, which may cap the number of deletions per delete operation.

## Outputs
| Field | Type | Description |
|---|---|---|
| `status` | `string` or `object` | Final response value produced by the `Finalise Output` code node and returned by the API response node. Its exact shape depends on the referenced script implementation. |

Below the table, output format details:
- The HTTP response is JSON with `content-type` set to `application/json`.
- The response body is a structured object containing a single top-level field, `status`.
- The exact wording or structure inside `status` is defined by the custom finalisation script, not by inline flow configuration, so consumers should validate against the deployed implementation rather than assume a fixed message format.
- The flow does not expose per-URL deletion counts in the visible node configuration, so completeness for multi-URL deletion may need to be inferred from custom script behavior or vector database logs.

## Dependencies
### Upstream Flows
- No Lamatic flow is required to execute immediately before this one; it is an API-entry maintenance flow.
- Operationally, it assumes one of the indexation flows has run earlier and stored vectors in the configured vector database:
  - `1A. Embedded Chatbot - PDF Indexation` must previously have indexed PDF-derived chunks with metadata that includes a `title` value compatible with this flow’s PDF delete filter.
  - The website indexation flow in the same kit must previously have indexed webpage-derived chunks with metadata that includes a `source` value compatible with this flow’s website delete filter.
- This flow consumes caller-supplied identifiers, not direct outputs passed programmatically from upstream flows. Specifically, it expects the invoker to provide `title` and/or `urls` that correspond to metadata created during prior indexation.

### Downstream Flows
- No downstream Lamatic flow is directly chained from this flow in the source graph.
- Indirectly, the embedded chatbot flow depends on the side effect of this flow: once vectors are deleted, future retrieval should no longer surface the removed content.
- Any admin UI, backend service, or orchestration layer that invokes this flow may consume the returned `status` field to confirm completion or present an operator-facing result.

### External Services
- Vector database connector — used to delete indexed vectors by metadata filters — required credential or connection is supplied through the private `vectorDB` input on `vectorNode_537` and `vectorNode_493`.
- Lamatic API-triggered flow runtime — used to receive the request and return the JSON response — required project/API credentials are managed by the deployed Lamatic environment rather than exposed as explicit node fields in this flow.
- Custom Lamatic script runtime — used by `embedded-chatbot-resource-deletion_code.ts` and `embedded-chatbot-resource-deletion_finalise-output.ts` to post-process deletion results and format the response — credentials are whatever the deployed scripts require, if any.

### Environment Variables
- No flow-specific environment variables are referenced directly in the visible TypeScript node configuration.
- Vector database credentials are supplied through the selected private `vectorDB` connection used by `VectorDB` nodes `vectorNode_537` and `vectorNode_493`.
- Platform-level Lamatic credentials for invoking the deployed flow are external to the flow graph and are not referenced by name inside this flow.

## Node Walkthrough
1. `API Request` (`triggerNode`) receives the deletion request payload. In practice, the flow expects the caller to send `type` and then either `title` for PDFs or `urls` for website resources.

2. `Condition` (`conditionNode`) checks `triggerNode_1.output.type`. If the value is exactly `pdf`, execution routes to the PDF deletion branch. Every other value, including website-like types, routes to the alternate branch.

3. `VectorDB` (`vectorNode_537`) runs only on the PDF branch. It performs a delete action against the configured vector database using a metadata filter where `title` equals `triggerNode_1.output.title`. This is the core removal step for indexed PDF content.

4. `Loop` (`forLoopNode_399`) runs on the non-PDF branch. It iterates over `triggerNode_1.output.urls`, treating the incoming URL list as the set of resources to remove.

5. `VectorDB` (`vectorNode_493`) executes once per URL inside the loop. On each iteration, it performs a delete action against the configured vector database using a metadata filter where `source` equals `forLoopNode_399.output.currentValue`. This removes indexed chunks associated with the current website URL.

6. `Loop End` (`forLoopEndNode_451`) closes each website deletion iteration and continues until all values in `urls` have been processed.

7. `Code` (`codeNode_571`) runs after the website loop completes. Its referenced script, `embedded-chatbot-resource-deletion_code.ts`, likely consolidates or normalizes loop results before the final response is prepared.

8. `Finalise Output` (`codeNode_690`) runs after either branch completes. For PDFs, it executes immediately after the single delete operation. For websites, it executes after the loop-completion code step. Its referenced script, `embedded-chatbot-resource-deletion_finalise-output.ts`, produces the final `status` value returned to the caller.

9. `API Response` (`responseNode`) returns a realtime JSON response with body mapping `{ status: codeNode_690.output }`. This is the canonical API output of the flow.

## Error Scenarios
| Symptom | Likely Cause | Recommended Fix |
|---|---|---|
| Request succeeds structurally but nothing is deleted | The resource identifiers do not exactly match stored metadata values in the vector database | Verify the indexed metadata shape from the ingestion flows. For PDFs, confirm the stored `title`; for websites, confirm the stored `source` URL format, including protocol, trailing slash, and redirects. |
| Flow fails at a `VectorDB` node | No `vectorDB` connection has been selected or the selected database credentials are invalid | Configure the private `vectorDB` input for both `vectorNode_537` and `vectorNode_493`, then redeploy and retry. |
| PDF deletion request goes down the website branch | `type` was not exactly `pdf` | Normalize caller input so `type` equals `pdf` for PDF deletions, or update the flow if broader type handling is required. |
| Website deletion branch processes zero items | `urls` is missing, empty, or not an array | Send a valid `urls` array in the API request and validate payload shape before invoking the flow. |
| PDF branch deletes the wrong records or too many records | Multiple indexed chunks share the same metadata `title` and the delete filter is title-based only | Ensure titles are unique enough for deletion purposes, or extend the flow to delete by a stronger identifier such as a resource ID or source URI. |
| Not all matching vectors are removed | Each vector delete node is configured with `limit` `20`, which may cap deletions per operation | Increase the configured delete limit or implement paginated/batched deletion if individual resources can exceed 20 stored vectors. |
| Final API response is unclear or inconsistent | The custom finalisation scripts define the output format and may not expose detailed deletion results | Review and, if needed, update `embedded-chatbot-resource-deletion_finalise-output.ts` and `embedded-chatbot-resource-deletion_code.ts` to return structured counts, branch details, or error context. |
| Deletion request is issued before any ingestion has happened | Upstream indexation flows have not yet created vectors for the given resource | Confirm the relevant PDF or website indexation flow completed successfully and wrote vectors into the same configured vector database. |
| Chat still references removed content shortly after deletion | Another environment or vector index is being queried, or retrieval caches are stale | Verify that the chat flow points to the same vector database, and clear or invalidate any application-side caches if present. |

## Notes
- The flow description in metadata is empty, so the implementation itself is the primary source of truth for behavior.
- Both deletion branches use a node named `VectorDB`, but they target different metadata fields: `title` for PDFs and `source` for website URLs.
- The website branch treats every non-`pdf` `type` value as eligible for URL-based deletion. If your system supports multiple resource kinds, add stricter branching to avoid accidental misuse.
- The flow’s visible configuration does not expose hard-delete versus soft-delete semantics beyond the vector database delete action. If your system also tracks resources in an application database or Lamatic project metadata, ensure those records are reconciled elsewhere.
- Because response shaping is script-driven, this flow is best treated as operationally side-effectful first and message-oriented second: the authoritative outcome is whether the target vectors were actually removed from the configured store.