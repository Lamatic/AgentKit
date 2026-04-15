/*
 * # Flow List All Documents
 * Lists every indexed document stored in Supabase and returns lightweight metadata so the broader PageIndex system can browse, select, and manage uploaded PDFs.
 *
 * ## Purpose
 * This flow is the document inventory endpoint for the PageIndex NotebookLM kit. Its job is simple but operationally important: query the persistent document store and return a reverse-chronological list of all uploaded documents with their identifiers, file metadata, indexing status, and tree size. That gives the frontend or any orchestration layer a reliable way to discover what content is currently available in the system.
 *
 * The outcome is a structured response containing a `documents` array and a `total` count. Each document entry includes `doc_id`, `file_name`, `file_url`, `tree_node_count`, `status`, and `created_at`. This matters because every later interaction in the wider pipeline depends on selecting an already-ingested document. Without this listing step, operators and users would have no canonical way to know which documents were uploaded successfully or are ready for tree inspection and chat.
 *
 * In the broader agent architecture, this flow sits on the operational browse side of the lifecycle rather than the ingest or answer-generation path. Flow 1 creates and persists documents and their tree indexes; this flow exposes those persisted records for discovery; sibling tree and chat flows then act on a chosen `doc_id`. In a plan-retrieve-synthesize framing, this flow does not retrieve content for answering questions directly. Instead, it supports planning and routing by surfacing the set of candidate documents that downstream flows can inspect or query.
 *
 * ## When To Use
 * - Use when the UI needs to populate a document list or dashboard of all uploaded PDFs.
 * - Use when an operator needs to confirm that document ingestion has created database records.
 * - Use when a downstream workflow needs a `doc_id` but does not yet know which documents exist.
 * - Use when you need to inspect high-level ingestion status across documents, such as whether a document appears indexed or still pending.
 * - Use when you want the most recently created documents first, since the flow explicitly sorts by `created_at` descending.
 *
 * ## When Not To Use
 * - Do not use when uploading or indexing a new PDF; that is handled by the upload-and-build-tree flow.
 * - Do not use when you need a document's tree structure or section hierarchy; use the tree inspection sibling flow instead.
 * - Do not use when you need to delete a document; use the tree/delete operational flow that handles destructive actions.
 * - Do not use when answering a question against document content; the chat-and-retrieve flow is the correct path.
 * - Do not use if the database credentials for the Postgres connector have not been configured, because this flow depends entirely on a live database query.
 * - Do not use if you expect file upload payloads or document content as input; this flow is read-only and trigger input is effectively empty.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `credentials` | credential selector | Yes | Postgres authentication configuration used by the `Postgres` node to connect to the Supabase/PostgreSQL database. |
 *
 * The API trigger itself does not require any business input fields from the caller. The flow's metadata test input is `{}`, and the trigger schema shown in the export is not functionally used to drive query behavior. In practice, the only real prerequisite is that the configured database credentials point to the correct database containing a `documents` table.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `documents` | array of objects | The full result set returned by the database query, one object per document. |
 * | `total` | number | The number of document records returned in `documents`. |
 *
 * Each object in `documents` contains the selected database columns: `doc_id`, `file_name`, `file_url`, `tree_node_count`, `status`, and `created_at`. The response is a structured JSON object, not prose. It is as complete as the underlying `documents` table query result and is not paginated, filtered, or truncated by the flow itself.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - No flow must execute immediately before this one for it to run; it is an API-triggered read flow and can be called independently.
 * - In practical system terms, it depends on the document ingestion flow having run at some earlier point and persisted rows into the `documents` table. Without prior ingestion, this flow still succeeds but returns an empty `documents` array and `total` of `0`.
 * - The relevant upstream producer in the broader kit is `flow-1-upload-pdf-build-tree-save`, which creates document records and associated tree metadata in the database. This flow does not directly consume that flow's API output, but it relies on the database state that flow writes.
 *
 * ### Downstream Flows
 * - The frontend document list view consumes `documents` and `total` to render browseable uploaded files.
 * - The tree inspection or delete flow can use a chosen document's `doc_id` from `documents` as the identifier for subsequent operations.
 * - The chat-and-retrieve flow can use a chosen document's `doc_id` from `documents` to route questions to the correct indexed document.
 *
 * ### External Services
 * - Supabase PostgreSQL — stores document metadata and is queried to fetch the full list of uploaded documents — required credential: the Postgres connector `credentials` configured for `postgresNode_831`
 * - Lamatic Flow API trigger/runtime — receives the API invocation and returns the JSON response — no additional per-node credential shown in this flow
 *
 * ### Environment Variables
 * - No explicit environment variables are referenced in the flow export.
 * - Database access is mediated through the Lamatic credential configured on `postgresNode_831`, rather than a named environment variable exposed in the flow definition.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) starts the flow when invoked through Lamatic's API endpoint. For this specific flow, it does not meaningfully transform or validate a business payload; it simply acts as the entry point for a request to list all documents.
 * 2. `Postgres` (`dynamicNode` using `postgresNode`) runs a single SQL query against the configured database. It selects `doc_id`, `file_name`, `file_url`, `tree_node_count`, `status`, and `created_at` from the `documents` table and orders the results by `created_at` in descending order so the newest uploads appear first.
 * 3. `API Response` (`responseNode`) maps the database result into the final JSON response. It returns `documents` as `postgresNode_831.output.queryResult` and computes `total` as the length of that result array. The response is sent with `application/json` content type.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails before returning data | The `credentials` input for `postgresNode_831` is missing, invalid, or points to an inaccessible database | Configure valid Postgres/Supabase credentials in Lamatic and ensure the selected credential is attached to this flow at runtime |
 * | Flow returns an empty `documents` array with `total` = `0` | No documents have been ingested yet, or the flow is pointed at the wrong database/schema | Verify that the upload-and-build-tree flow has run successfully and that this flow's credentials target the correct Supabase project and database |
 * | Database error mentioning missing table or columns | The expected `documents` table or one of its columns does not exist in the connected database | Align the database schema with the kit's expected structure or point the flow to the intended environment containing the `documents` table |
 * | Caller expects filters, pagination, or search but receives every record | The flow is designed as an unconditional list query with no request-driven filtering logic | Add a separate filtered listing flow or extend this one; do not assume request parameters change behavior in the current implementation |
 * | Caller sends malformed or unexpected request fields and sees no effect | The trigger does not use request payload fields to parameterize the query | Invoke the flow with an empty or minimal request and treat it as a read-only list endpoint |
 * | Document expected from a previous upload is not present | The upstream ingestion flow did not complete persistence successfully, or persistence targeted a different database | Check the upstream ingestion run logs, confirm the document row was written, and ensure both flows share the same database configuration |
 *
 * ## Notes
 * - The query is fully static and read-only; there is no conditional branching, filtering, or pagination logic in this flow.
 * - Because the flow returns all rows from `documents`, response size grows with the number of uploaded files. That is acceptable for small to moderate document inventories but may need pagination if the dataset grows significantly.
 * - The flow exposes `file_url` directly from the database. Any access-control expectations for that URL must be enforced by how the URL is generated and stored upstream, not by this flow.
 * - The `status` and `tree_node_count` fields are only as accurate as the upstream ingestion flow's persistence logic. This flow does not recalculate or validate them.
 */

// Flow: flow-list-all-documents
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Flow List All Documents",
  "description": "List all uploaded documents stored in Supabase, returning doc_id, file_name, file_url, tree_node_count, status, and created_at for each document.",
  "tags": [
    "list",
    "documents",
    "pageindex",
    "notebooklm",
    "supabase"
  ],
  "testInput": "{}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "postgresNode_831": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for postgres authentication.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\"sampleInput\":\"string\"}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "postgresNode_831",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_831",
        "query": "SELECT doc_id, file_name, file_url, tree_node_count, status, created_at FROM documents ORDER BY created_at DESC;",
        "action": "runQuery",
        "nodeName": "Postgres",
        "credentials": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"documents\": \"{{postgresNode_831.output.queryResult}}\",\n  \"total\": \"{{postgresNode_831.output.queryResult.length}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-postgresNode_831",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "postgresNode_831",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "postgresNode_831-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "postgresNode_831",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
