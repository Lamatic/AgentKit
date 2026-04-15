/*
 * # Flow 1 Upload PDF Build Tree Save
 * Upload a PDF, build a hierarchical document tree from its extracted contents, and persist the indexed result so the wider PageIndex pipeline can browse and chat against it.
 *
 * ## Purpose
 * This flow is the ingestion and indexing entry point for the PageIndex NotebookLM system. Its job is to accept a PDF upload request, normalize the file input, extract page-level text, convert that extraction into a format suitable for structure inference, generate a tree-shaped index of the document, and save the resulting document record to persistent storage. In practical terms, it turns an uploaded PDF into a durable, queryable asset that later flows can inspect, retrieve from, and answer questions against.
 *
 * The outcome of this flow is not just a stored file reference. It produces a document identifier, preserves the original file name, computes a tree node count, and stores both the raw extracted content and the generated tree so they can be reused without reprocessing the PDF on every downstream operation. That matters because the broader system avoids embeddings and vector search; instead, it depends on a structural tree index derived from the PDF itself. If this flow fails or is skipped, the rest of the document-centric pipeline has nothing reliable to browse or retrieve from.
 *
 * In the wider agent architecture, this flow sits at the very start of the ingest → persist → browse/chat chain. It is the prerequisite for document listing, tree inspection, deletion, and chat retrieval flows described in the parent agent. Rather than answering questions directly, it prepares the canonical indexed representation that later flows use for deterministic section-based retrieval and final answer synthesis.
 *
 * ## When To Use
 * - Use when a user uploads a new PDF that should become available for browsing and chat in the PageIndex system.
 * - Use when the system needs to create a fresh structural index for a document that does not yet exist in persistent storage.
 * - Use when a frontend or orchestration layer has a file payload in API form and needs Lamatic to handle extraction, tree generation, and persistence in one execution.
 * - Use when onboarding a document into the vectorless tree-structured RAG pipeline before any retrieval or question answering can occur.
 * - Use when a document must be saved to the backing database together with its generated hierarchical tree.
 *
 * ## When Not To Use
 * - Do not use when the user wants to ask a question about a document that has already been indexed; the chat and retrieval flow is the correct path then.
 * - Do not use when the goal is only to list existing documents or inspect/delete a stored tree; sibling operational flows handle those actions.
 * - Do not use when no PDF payload is available at request time, or when the request contains only a document identifier without file content or a resolvable file URL.
 * - Do not use for non-PDF documents, since the extraction node is explicitly configured for `pdf` input.
 * - Do not use if persistent database connectivity or required storage/database credentials have not been configured; ingestion may proceed partway, but the flow cannot complete its core purpose of saving the indexed result.
 * - Do not use as a generic summarization flow; its LLM stage is specialized for structured tree construction rather than free-form analysis.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `file_url` | string | No | URL pointing to the PDF file to ingest. Used as a source reference and passed through the flow for persistence. |
 * | `file_name` | string | No | Original name of the uploaded PDF. Returned downstream and saved with the indexed document record. |
 * | `file_base64` | string | No | Base64-encoded PDF payload. Intended for upload-style requests where the file content is sent directly. |
 * | `mime_type` | string | No | MIME type of the uploaded file, expected to describe a PDF payload such as `application/pdf`. |
 * | `generativeModelName` | model | Yes | Instructor model selection for the `Generate Tree` node. This is configured as a private flow input and must resolve to a text generation model compatible with structured JSON output. |
 *
 * Below the table, the main trigger schema allows several file-carrying fields, but the flow assumes they collectively represent a valid PDF upload request. At least one usable file source must be present so the initial code step can resolve a downstream-accessible file location. Although the trigger marks the request shape rather than field-by-field requiredness, a practical invocation should include a valid PDF as `file_base64`, a resolvable `file_url`, or both, along with a meaningful `file_name`. The `mime_type` should indicate a PDF, and the selected model must support instruction-following structured generation.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `doc_id` | string | Persistent identifier for the saved document record. |
 * | `file_name` | string | File name associated with the saved document. |
 * | `tree_node_count` | number | Count of nodes generated in the document tree. |
 * | `status` | string | High-level save status returned from the persistence step. |
 *
 * Below the table, the API response is a compact structured object rather than the full extracted PDF or full tree payload. The detailed tree and raw extracted data are used internally and are expected to be saved to storage/database layers, while the caller receives just enough metadata to confirm successful ingestion and reference the saved document later. If persistence fails, these fields may be missing or reflect an error state depending on how the save script surfaces failures.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - This is a standalone entry-point flow. No other Lamatic flow must run before it.
 * - The only prerequisite is that the caller can provide a valid PDF upload payload and that any required platform, model, storage, and database configuration has already been set up.
 *
 * ### Downstream Flows
 * - Document listing flows consume the persisted document record created here. They rely on the saved document metadata, especially `doc_id` and `file_name`, to show indexed documents to users.
 * - Tree inspection or delete flows depend on the document saved here. They typically require `doc_id` to fetch or remove the stored tree and associated record.
 * - The chat and retrieval flow depends indirectly on this flow’s persisted outputs. It needs the stored tree, raw extracted content, and document identity created here; from this flow’s API response, `doc_id` is the key reference used to locate that stored material.
 *
 * ### External Services
 * - Lamatic file extraction service — extracts text from the uploaded PDF page by page — uses Lamatic's configured PDF extraction capability inside `Extract PDF`
 * - LLM provider selected by `generativeModelName` — generates the structured hierarchical tree from formatted page data — credential depends on the chosen Lamatic model configuration used by `Generate Tree`
 * - Supabase or Postgres-compatible persistence layer — stores the document record, extracted raw data, and generated tree — credentials/environment variables are used by `Save to Supabase`
 * - File storage or URL-accessible object source — hosts or serves the PDF at a resolved location if the upload must first be materialized — used by `Code` before `Extract PDF`
 *
 * ### Environment Variables
 * - `SUPABASE_URL` — database or REST endpoint for persistence — used by `Save to Supabase`
 * - `SUPABASE_SERVICE_ROLE_KEY` or equivalent Supabase write credential — authorizes insertion of indexed document data — used by `Save to Supabase`
 * - Model-provider credentials required by the selected Lamatic model configuration — enable the LLM call for tree generation — used by `Generate Tree`
 * - Any storage configuration required by the upload-resolution script — supports turning the incoming file payload into `resolved_url` — used by `Code`
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`)
 *    - This is the flow entry point. It accepts a realtime API request shaped to carry `file_url`, `file_name`, `file_base64`, and `mime_type`. In this flow, that request represents a PDF upload or a reference to one.
 *
 * 2. `Code` (`codeNode`)
 *    - This node normalizes the incoming file payload into a usable downstream representation. Its declared outputs show the intent clearly: it emits `file_name`, `resolved_url`, and `uploaded_to_storage`. In this flow, that means it likely validates the incoming file fields, preserves the name, and either uses the provided URL or uploads/derives a URL from the base64 payload so the extractor can read the PDF from a concrete location.
 *
 * 3. `Extract PDF` (`extractFromFileNode`)
 *    - This node reads the PDF from `{{codeNode_630.output.resolved_url}}` and performs PDF extraction with `joinPages` disabled. As a result, the flow keeps page-level structure rather than flattening the document into one long string. That page-granular output is important because downstream formatting and tree generation depend on page boundaries and section positioning.
 *
 * 4. `Format Pages` (`codeNode`)
 *    - This node transforms the raw PDF extraction into several structured artifacts: `pages`, `raw_text`, `toc_items`, `page_count`, `pages_json`, and `has_native_toc`. In effect, it prepares the extracted content for tree construction by cleaning, organizing, and possibly detecting native table-of-contents cues. It bridges low-level extraction output and the LLM’s structured tree-building task.
 *
 * 5. `Generate Tree` (`InstructorLLMNode`)
 *    - This node uses a configured text generation model plus dedicated system and user prompts to produce a JSON-structured tree. The expected schema contains a `tree` array whose items include `node_id`, `title`, `start_index`, `end_index`, `summary`, and `nodes`, along with a top-level `tree_node_count`. In this flow, the LLM is not generating prose for display; it is acting as a structure inference component that converts formatted page data into the document’s navigable hierarchy.
 *
 * 6. `Variables` (`variablesNode`)
 *    - This node packages the key outputs needed for persistence into a clean handoff object. It maps `file_name` and `file_url` from the trigger, `tree` and `tree_node_count` from `Generate Tree`, and `raw_data` from `Extract PDF`. This step makes the save script’s inputs explicit and stable.
 *
 * 7. `Save to Supabase` (`codeNode`)
 *    - This node writes the document and indexing artifacts to persistent storage. Its declared outputs indicate that it returns `success`, `status`, `status_code`, `doc_id`, `file_name`, `tree_node_count`, `response_text`, and `error`. In this flow, it is the commit point: until this step succeeds, the uploaded PDF has been processed but not durably enrolled in the PageIndex system.
 *
 * 8. `API Response` (`responseNode`)
 *    - This node returns a compact response to the caller, exposing `doc_id`, `file_name`, `tree_node_count`, and `status` from the save step. That gives the frontend or orchestrator the document handle it needs for subsequent browse, inspect, delete, or chat operations.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Flow fails early with missing or unusable file information | The request did not include a valid `file_base64`, `file_url`, or recognisable PDF metadata for the `Code` node to normalize | Ensure the trigger payload includes an actual PDF source, a sensible `file_name`, and `mime_type` consistent with a PDF |
 * | PDF extraction returns empty or incomplete `files` output | The resolved URL is inaccessible, the uploaded content is corrupt, or the source is not a valid PDF | Verify the PDF is reachable and not corrupted, and confirm the `Code` node produces a correct `resolved_url` |
 * | Tree generation returns no `tree` or a malformed structure | The selected model is misconfigured, lacks credentials, or the formatted extraction did not provide enough usable structure | Check the `generativeModelName` mapping, confirm provider credentials, and inspect whether `Format Pages` produced meaningful `pages_json`, `toc_items`, or `raw_text` |
 * | Save step fails with authorization or connectivity errors | Supabase credentials or endpoint variables are missing or invalid | Set the required `SUPABASE_URL` and service-role or equivalent write credential used by `Save to Supabase` |
 * | Response has no `doc_id` even though extraction succeeded | The persistence step failed after processing, so no durable document record was created | Review logs for `Save to Supabase`, confirm schema compatibility, and rerun after fixing database access |
 * | Output `tree_node_count` is zero or unexpectedly low | The PDF had poor extractable text, lacked a usable TOC, or the LLM could not infer meaningful hierarchy | Test with a text-readable PDF, review the formatting script behavior, and adjust prompts/model choice if reconstruction quality is insufficient |
 * | Caller tries to chat against the document immediately but later flows cannot find it | This ingestion flow did not complete successfully, or the downstream flow is using the wrong `doc_id` | Confirm `status` indicates success, persist the returned `doc_id`, and pass that exact identifier into downstream flows |
 * | Non-PDF files cause extraction failure | The extractor is configured specifically for `pdf` format | Route non-PDF uploads to an appropriate ingestion path or convert them to PDF before invoking this flow |
 * | Model selection input is missing at runtime | The private `generativeModelName` input for `Generate Tree` was not configured in the environment or deployment | Configure a valid Lamatic instructor-compatible text model before executing the flow |
 *
 * ## Notes
 * - The flow response is intentionally minimal. The full tree and raw extraction are internal persistence artifacts rather than direct API outputs.
 * - Page boundaries are preserved during extraction because `joinPages` is disabled. This is important for later structural reasoning and makes the flow better suited to section-aware indexing than to simple whole-document summarization.
 * - The flow references prompts and scripts externally, so behavior depends materially on those assets even though the flow graph shows only their wiring. Changes to prompt wording, formatting logic, or save logic can alter tree quality and persistence semantics without changing the node topology.
 * - `Variables` maps `file_url` from the original trigger rather than from the normalized `resolved_url`. If the save script expects the final accessible location, developers should verify whether the original URL or the resolved/uploaded URL is what should be persisted.
 * - The trigger schema presents multiple file-source options, but the flow topology suggests a single-document ingestion path. Batch uploads are not implied by this configuration.
 */

// Flow: flow-1-upload-pdf-build-tree-save

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Flow 1 Upload PDF Build Tree Save",
  "description": "Upload a PDF, build a tree index, and save to database.",
  "tags": [
    "upload",
    "pdf",
    "pageindex",
    "notebooklm"
  ],
  "testInput": "{}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_tree": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "flow_1_upload_pdf_build_tree_save_generate_tree_system": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_system.md",
    "flow_1_upload_pdf_build_tree_save_generate_tree_user": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_user.md"
  },
  "scripts": {
    "flow_1_upload_pdf_build_tree_save_code": "@scripts/flow-1-upload-pdf-build-tree-save_code.ts",
    "flow_1_upload_pdf_build_tree_save_format_pages": "@scripts/flow-1-upload-pdf-build-tree-save_format-pages.ts",
    "flow_1_upload_pdf_build_tree_save_save_to_supabase": "@scripts/flow-1-upload-pdf-build-tree-save_save-to-supabase.ts"
  },
  "modelConfigs": {
    "flow_1_upload_pdf_build_tree_save_generate_tree": "@model-configs/flow-1-upload-pdf-build-tree-save_generate-tree.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"file_url\": \"string\",\n  \"file_name\": \"string\",\n  \"file_base64\": \"string\",\n  \"mime_type\": \"string\"\n}"
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
    "id": "codeNode_630",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "file_name": "string",
        "resolved_url": "string",
        "uploaded_to_storage": "boolean"
      },
      "values": {
        "id": "codeNode_630",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_code.ts",
        "nodeName": "Code"
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
    "selected": true
  },
  {
    "id": "extractFromFileNode_1",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "extractFromFileNode",
      "schema": {
        "files": "object"
      },
      "values": {
        "id": "extractFromFileNode_1",
        "format": "pdf",
        "fileUrl": "{{codeNode_630.output.resolved_url}}",
        "nodeName": "Extract PDF",
        "joinPages": false,
        "operation": "extractFromPDF"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_format",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "pages": "array",
        "raw_text": "string",
        "toc_items": "array",
        "page_count": "number",
        "pages_json": "string",
        "has_native_toc": "boolean"
      },
      "values": {
        "id": "codeNode_format",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_format-pages.ts",
        "nodeName": "Format Pages"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "InstructorLLMNode_tree",
    "data": {
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "schema": {},
      "values": {
        "id": "InstructorLLMNode_tree",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"tree\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"node_id\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"start_index\": {\n            \"type\": \"number\"\n          },\n          \"end_index\": {\n            \"type\": \"number\"\n          },\n          \"summary\": {\n            \"type\": \"string\"\n          },\n          \"nodes\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"tree_node_count\": {\n      \"type\": \"number\",\n      \"description\": \"Total number of nodes in the tree array\"\n    }\n  }\n}",
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_user.md"
          }
        ],
        "nodeName": "Generate Tree",
        "generativeModelName": "@model-configs/flow-1-upload-pdf-build-tree-save_generate-tree.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "variablesNode_617",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "variablesNode",
      "schema": {},
      "values": {
        "id": "variablesNode_617",
        "mapping": "{\n  \"file_name\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.file_name}}\"\n  },\n  \"file_url\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.file_url}}\"\n  },\n  \"tree\": {\n    \"type\": \"string\",\n    \"value\": \"{{InstructorLLMNode_tree.output.tree}}\"\n  },\n  \"raw_data\": {\n    \"type\": \"string\",\n    \"value\": \"{{extractFromFileNode_1.output.files}}\"\n  },\n  \"tree_node_count\": {\n    \"type\": \"number\",\n    \"value\": \"{{InstructorLLMNode_tree.output.tree_node_count}}\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "codeNode_save",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "error": "null",
        "doc_id": "string",
        "status": "string",
        "success": "boolean",
        "file_name": "string",
        "status_code": "number",
        "response_text": "string",
        "tree_node_count": "number"
      },
      "values": {
        "id": "codeNode_save",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_save-to-supabase.ts",
        "nodeName": "Save to Supabase"
      },
      "disabled": false
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "id": "responseNode_triggerNode_1",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"doc_id\": \"{{codeNode_save.output.doc_id}}\",\n  \"file_name\": \"{{codeNode_save.output.file_name}}\",\n  \"tree_node_count\": \"{{codeNode_save.output.tree_node_count}}\",\n  \"status\": \"{{codeNode_save.output.status}}\"\n}"
      },
      "disabled": false,
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 910
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "extractFromFileNode_1-codeNode_format",
    "type": "defaultEdge",
    "source": "extractFromFileNode_1",
    "target": "codeNode_format",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_format-InstructorLLMNode_tree",
    "type": "defaultEdge",
    "source": "codeNode_format",
    "target": "InstructorLLMNode_tree",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_save-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_save",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_617-codeNode_save",
    "type": "defaultEdge",
    "source": "variablesNode_617",
    "target": "codeNode_save",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_tree-variablesNode_617",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_tree",
    "target": "variablesNode_617",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-codeNode_630",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_630",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_630-extractFromFileNode_1",
    "type": "defaultEdge",
    "source": "codeNode_630",
    "target": "extractFromFileNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
