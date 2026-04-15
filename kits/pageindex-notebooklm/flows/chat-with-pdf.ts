/*
 * # Chat with Pdf
 * A flow that answers questions against an already indexed PDF by retrieving relevant sections from a stored tree structure and synthesizing a grounded response as the chat stage of the wider PageIndex pipeline.
 *
 * ## Purpose
 * This flow is responsible for the question-answering phase of the PageIndex NotebookLM system after a document has already been ingested and stored. Rather than using embeddings or a vector database, it retrieves document context from a hierarchical tree index persisted in PostgreSQL. The flow accepts a document identifier and a user query, loads the document’s stored tree and raw text, asks an LLM to decide which tree nodes are relevant, reconstructs the corresponding textual context, and then generates a final answer grounded in those retrieved sections.
 *
 * The outcome is a structured API response containing the answer, the model’s chat messages, the retrieved nodes used as evidence, the retrieval-planning reasoning field, and the originating document identifier. This matters because it turns the previously indexed PDF into an interactive, explainable knowledge source: operators can see not only the answer, but also which tree nodes were selected and what retrieval plan the system followed.
 *
 * In the broader pipeline, this is the retrieve-and-synthesize flow. Upstream ingestion builds and stores the document tree and source text. Operational sibling flows list documents or inspect/delete trees. This flow sits after indexing and before any frontend rendering of the final answer, making it the primary runtime path for end-user chat once a PDF has been processed.
 *
 * ## When To Use
 * - Use when a user wants to ask a natural-language question about a PDF that has already been uploaded and indexed.
 * - Use when you have a valid `doc_id` that refers to a row in the `documents` table containing a stored `tree` and `raw_text`.
 * - Use when the application needs grounded answers based on structural document sections rather than semantic vector search.
 * - Use when the UI or orchestration layer wants both a final answer and retrieval transparency, including `retrieved_nodes` and the planner’s `thinking` output.
 * - Use when continuing a chat session where prior conversational `messages` should be passed through to the answer-generation model.
 *
 * ## When Not To Use
 * - Do not use for first-time document ingestion; the upload-and-index flow must run first to create the stored `tree`, `raw_text`, and document record.
 * - Do not use when the input is a raw PDF file or file upload payload rather than a previously issued `doc_id`.
 * - Do not use when the goal is to list available documents; the document-list flow is the correct sibling flow.
 * - Do not use when the goal is to inspect or delete a document tree without asking a question; the tree/browse/delete flow should handle that.
 * - Do not use when no PostgreSQL/Supabase credentials are configured, because the flow cannot retrieve the stored document.
 * - Do not use when `doc_id` does not correspond to an indexed document, because retrieval planning depends on the persisted tree structure.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `doc_id` | `string` | Yes | Identifier of the indexed document to query. Used to load the document’s `tree`, `raw_text`, and `file_name` from storage. |
 * | `query` | `string` | Yes | The user’s question about the document. Used by the retrieval-planning model and the final answer-generation model. |
 * | `messages` | `string` | No in schema, but expected by downstream prompting | Serialized prior chat context passed through to the answer-generation stage for conversational continuity. |
 *
 * The trigger schema declares all three fields as strings. In practice, `doc_id` must match an existing database record, `query` should be a meaningful natural-language question, and `messages` is expected to be in whatever serialized format the downstream model config and prompt expect. The flow assumes the document has already been indexed into a tree-backed representation; it does not validate or build that structure itself.
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `answer` | `string` | Final grounded answer generated from the retrieved document context. |
 * | `messages` | `string` or model-defined message payload | Conversation/message output returned by the final LLM node. |
 * | `retrieved_nodes` | `array` | The set of tree nodes selected and reconstructed as supporting context for the answer. |
 * | `thinking` | `string` | Retrieval-planning rationale produced by the structured LLM node. |
 * | `doc_id` | `string` | Echo of the requested document identifier. |
 *
 * The response is a JSON object. `answer` is prose, `retrieved_nodes` is structured evidence derived from the document tree, and `thinking` is an introspection-style planning field intended for debugging or transparency rather than end-user display. Completeness of the answer depends on the quality of the stored tree, the retrieval plan, and any context-length limits imposed by the chosen models.
 *
 * ## Dependencies
 * ### Upstream Flows
 * - `flow-1-upload-pdf-build-tree-save` must run before this flow.
 *   - It must have produced and persisted the document record in PostgreSQL/Supabase.
 *   - This flow depends on that upstream process having stored at least `doc_id`, `tree`, `raw_text`, and `file_name` in the `documents` table.
 *   - This flow consumes the upstream artifact indirectly via its own `doc_id` input, which is used to fetch the saved document state.
 *
 * ### Downstream Flows
 * - No Lamatic flow is shown as consuming this flow directly.
 * - The primary downstream consumer is the frontend or any orchestration client calling the API endpoint.
 *   - It typically uses `answer` for chat display.
 *   - It may use `messages` to continue the conversation state.
 *   - It may use `retrieved_nodes` and `thinking` for debugging, explainability, or tree-view highlighting.
 *
 * ### External Services
 * - PostgreSQL/Supabase — stores indexed documents and serves the persisted `tree`, `raw_text`, and `file_name` for a given `doc_id` — required via the Postgres credential selected on `postgresNode_817`
 * - Instructor-capable text generation model — produces structured retrieval output with `thinking` and `node_list` — configured through `InstructorLLMNode_432`
 * - Chat text generation model — generates the final natural-language answer from retrieved context and conversation state — configured through `LLMNode_392`
 *
 * ### Environment Variables
 * - No explicit environment variables are declared in the flow source.
 * - Database and model access are provided through Lamatic credential and model configuration mechanisms rather than named environment variables in this flow file.
 *
 * ## Node Walkthrough
 * 1. `API Request` (`triggerNode`) receives an API call with `doc_id`, `query`, and `messages`. It is configured for a realtime response and defines the request schema that the rest of the flow relies on.
 *
 * 2. `Postgres` (`postgresNode`) queries the `documents` table for the row matching `triggerNode_1.output.doc_id`. It retrieves `tree`, `raw_text`, and `file_name`, limiting the result to a single record. This is the point where the flow turns a document identifier into the stored structural and textual data needed for retrieval.
 *
 * 3. `Code` (`codeNode_429`) runs shared script logic from `@scripts/chat-with-pdf_code.ts` to transform the database result into retrieval-planning inputs. Its declared outputs are `toc_json` and `node_count`, which indicates it prepares a JSON representation of the document tree or table of contents and computes the number of nodes available for selection.
 *
 * 4. `Generate JSON` (`InstructorLLMNode`) uses the prompts `chat-with-pdf_generate-json_system` and `chat-with-pdf_generate-json_user` to analyze the user’s question against the prepared tree structure. It returns a structured object containing `thinking` and `node_list`. In effect, this node performs retrieval planning: it decides which document nodes are most relevant before any final answer is written.
 *
 * 5. `Code` (`codeNode_358`) runs the same referenced script file again, this time to materialize the retrieval result into answer-ready context. Its outputs are `context`, `total_chars`, and `retrieved_nodes`, which indicates it takes the planned `node_list`, pulls or reconstructs the corresponding text from the stored document content, and packages both the raw context string and structured node evidence.
 *
 * 6. `Generate Text` (`LLMNode`) uses the prompts `chat-with-pdf_generate-text_system` and `chat-with-pdf_generate-text_user` to generate the final answer. This node receives the assembled `context`, the user `query`, and model-configured `messages` state, then produces `generatedResponse` and updated `messages` suitable for conversational use.
 *
 * 7. `API Response` (`responseNode`) returns a JSON payload mapping the flow outputs to the public API contract. It exposes `answer` from `LLMNode_392.output.generatedResponse`, `messages` from `LLMNode_392.output.messages`, `retrieved_nodes` from `codeNode_358.output.retrieved_nodes`, `thinking` from `InstructorLLMNode_432.output.thinking`, and the original `doc_id` from the trigger.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Request fails before retrieval starts | Missing or invalid Postgres credential on `postgresNode_817` | Configure a valid PostgreSQL/Supabase credential in the flow inputs and verify database connectivity. |
 * | Response contains no useful answer or the flow errors after the database step | `doc_id` does not exist in `documents`, so the query returns no row | Ensure the upload/index flow ran successfully first and pass a valid stored `doc_id`. |
 * | Flow returns an answer with weak grounding or irrelevant sections | The stored `tree` is poor quality, malformed, or incomplete from upstream ingestion | Re-run ingestion for the document, inspect tree-generation quality, and verify the upstream flow persisted a correct structure. |
 * | Structured retrieval step fails | `InstructorLLMNode_432` model is not configured, unavailable, or incompatible with the expected JSON schema | Select a valid instructor/structured-output capable model and verify the linked model config. |
 * | Final answer generation fails | `LLMNode_392` model is missing, misconfigured, or exceeds context limits | Configure a valid chat-capable model and reduce retrieved context if necessary. |
 * | Chat continuity behaves unexpectedly | `messages` input is missing or not in the format expected by the model config/prompts | Pass `messages` in the same serialized structure expected by the frontend and model config, or start a fresh conversation with an empty value if supported. |
 * | Retrieval returns empty `retrieved_nodes` | The planner did not select any nodes, or the code step could not map `node_list` back to valid tree nodes | Check prompt quality, inspect `thinking`, and verify the stored tree and script logic are aligned to the same node identifiers. |
 * | Malformed input error at trigger | `doc_id`, `query`, or `messages` are not provided as strings per the trigger schema | Send all trigger fields in the declared string format and ensure the API client matches the schema. |
 * | Upstream dependency appears satisfied but answers are still empty | The upstream ingestion stored the document incompletely, such as missing `raw_text` or `tree` fields | Validate the `documents` row contents in the database and reprocess the PDF if required. |
 *
 * ## Notes
 * - This flow is intentionally vectorless: retrieval is driven by the stored document tree rather than embeddings or semantic nearest-neighbor search.
 * - The same script file powers both code nodes, which suggests a two-phase transformation pattern: first tree normalization for planning, then node materialization for answer context.
 * - `thinking` is returned to the client, which is useful for debugging retrieval decisions but may not be appropriate for all production user interfaces.
 * - The trigger schema marks `messages` as a string, so callers should be consistent about how conversation state is serialized across turns.
 * - Because retrieval depends on stored structural metadata, answer quality is tightly coupled to the quality of TOC extraction and tree construction performed upstream.
 */

// Flow: chat-with-pdf

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Chat with Pdf",
  "description": "chat-with-pdf using NotebookLM",
  "tags": [
    "pdf",
    "notebooklm",
    "assistant",
    "document-search"
  ],
  "testInput": "{}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "postgresNode_817": [
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
  ],
  "InstructorLLMNode_432": [
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
  ],
  "LLMNode_392": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
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
      },
      "isPrivate": true
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
    "chat_with_pdf_generate_json_system": "@prompts/chat-with-pdf_generate-json_system.md",
    "chat_with_pdf_generate_json_user": "@prompts/chat-with-pdf_generate-json_user.md",
    "chat_with_pdf_generate_text_system": "@prompts/chat-with-pdf_generate-text_system.md",
    "chat_with_pdf_generate_text_user": "@prompts/chat-with-pdf_generate-text_user.md"
  },
  "scripts": {
    "chat_with_pdf_code": "@scripts/chat-with-pdf_code.ts"
  },
  "modelConfigs": {
    "chat_with_pdf_generate_json": "@model-configs/chat-with-pdf_generate-json.ts",
    "chat_with_pdf_generate_text": "@model-configs/chat-with-pdf_generate-text.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"doc_id\": \"string\",\n  \"query\": \"string\",\n  \"messages\": \"string\"\n}"
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
    "id": "postgresNode_817",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_817",
        "query": "SELECT tree, raw_text, file_name FROM documents WHERE doc_id = '{{triggerNode_1.output.doc_id}}' LIMIT 1;",
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
    "id": "codeNode_429",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "toc_json": "string",
        "node_count": "number"
      },
      "values": {
        "id": "codeNode_429",
        "code": "@scripts/chat-with-pdf_code.ts",
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
      "y": 260
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_432",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_432",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"thinking\": {\n      \"type\": \"string\"\n    },\n    \"node_list\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/chat-with-pdf_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chat-with-pdf_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/chat-with-pdf_generate-json.ts",
        "messages": "@model-configs/chat-with-pdf_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/chat-with-pdf_generate-json.ts",
        "generativeModelName": "@model-configs/chat-with-pdf_generate-json.ts"
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
    "selected": false
  },
  {
    "id": "codeNode_358",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "context": "string",
        "total_chars": "number",
        "retrieved_nodes": "array"
      },
      "values": {
        "id": "codeNode_358",
        "code": "@scripts/chat-with-pdf_code.ts",
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
      "y": 520
    },
    "selected": true
  },
  {
    "id": "LLMNode_392",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_392",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/chat-with-pdf_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chat-with-pdf_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/chat-with-pdf_generate-text.ts",
        "messages": "@model-configs/chat-with-pdf_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/chat-with-pdf_generate-text.ts",
        "credentials": "@model-configs/chat-with-pdf_generate-text.ts",
        "generativeModelName": "@model-configs/chat-with-pdf_generate-text.ts"
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
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_392.output.generatedResponse}}\",\n  \"messages\": \"{{LLMNode_392.output.messages}}\",\n  \"retrieved_nodes\": \"{{codeNode_358.output.retrieved_nodes}}\",\n  \"thinking\": \"{{InstructorLLMNode_432.output.thinking}}\",\n  \"doc_id\": \"{{triggerNode_1.output.doc_id}}\"\n}"
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
      "y": 780
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-postgresNode_817",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "postgresNode_817",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_432-codeNode_358",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_432",
    "target": "codeNode_358",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "postgresNode_817-codeNode_429",
    "type": "defaultEdge",
    "source": "postgresNode_817",
    "target": "codeNode_429",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_429-InstructorLLMNode_432",
    "type": "defaultEdge",
    "source": "codeNode_429",
    "target": "InstructorLLMNode_432",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_358-LLMNode_392",
    "type": "defaultEdge",
    "source": "codeNode_358",
    "target": "LLMNode_392",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_392-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_392",
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
