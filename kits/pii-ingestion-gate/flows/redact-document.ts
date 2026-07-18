/*
 * # Redact Document
 * Produces an ingestion-safe version of a document by replacing every
 * sensitive span with a typed placeholder, plus a masked audit trail of what
 * was removed.
 *
 * ## Purpose
 * When the `scan-document` flow returns a `needs_redaction` verdict, this
 * flow does the actual cleanup: it rewrites the document with placeholders
 * like `[REDACTED:EMAIL_1]` and `[REDACTED:API_KEY_1]` while preserving all
 * non-sensitive content and formatting exactly. The output can be embedded
 * into a vector index without leaking PII, and the audit trail (with masked
 * originals, never raw values) gives compliance teams a reviewable record.
 *
 * ## When To Use
 * - After a scan verdict of `needs_redaction`, to produce the safe version.
 * - As a standalone anonymization step for logs, tickets, or transcripts
 *   before sharing or indexing them.
 *
 * ## When Not To Use
 * - Not for documents the scan marked `blocked` (e.g. credential dumps) —
 *   those should be rejected, not sanitized.
 * - Not a substitute for access control on the source documents.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `document` | `string` | Yes | Raw text of the document to redact. |
 * | `policy` | `string` | No | Optional redaction policy, e.g. "keep internal names, redact everything else". |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `result` | `object` | `redacted_document` (string), `safe_to_index` (boolean), `redactions[]` (placeholder, category, type, masked_original, reason), `notes` (string). |
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives `document` and optional `policy`.
 * 2. `Redact Sensitive Data` (`InstructorLLMNode`) — rewrites the document
 *    with numbered, typed placeholders and emits the audit trail in a strict
 *    JSON schema. Placeholders are deterministic within a document
 *    (`[REDACTED:EMAIL_1]`, `[REDACTED:EMAIL_2]`, ...), so repeated values
 *    map to the same placeholder and entity relationships survive redaction.
 * 3. `API Response` — returns `{ result }`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Redacted text is paraphrased instead of preserved | Weak model or edited system prompt | Use a stronger model; the system prompt forbids rewriting non-sensitive content. |
 * | `safe_to_index` is true but values remain | Model missed a span | Re-run `scan-document` on the redacted output as a verification pass (the app does this pattern manually). |
 * | Flow fails at LLM node | Missing provider credentials | Configure a model + credential in the node's model config. |
 */

// Flow: redact-document

// -- Meta --
export const meta = {
  "name": "Redact Document",
  "description": "Produce an ingestion-safe version of a document by replacing every sensitive span with a typed placeholder, plus a masked audit trail of what was removed.",
  "tags": ["security", "privacy", "rag", "compliance"],
  "testInput": "{\"document\":\"Meeting notes 2026-07-01\\nAttendees: John Smith (john.smith@acme.com, +1 415-555-0132)\\nAction: rotate prod key sk-live-9f8a7b6c5d4e3f2a1b0c\\nCustomer SSN on file: 523-45-6789\\nBudget approved: $250k\",\"policy\":\"Keep internal names. Redact contact details, credentials, and government IDs.\"}",
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-ingestion-gate",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-ingestion-gate#readme",
  "deployUrl": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fpii-ingestion-gate%2Fapps",
  "author": {
    "name": "Kritensh Kumar",
    "email": "kritensh.kumar@example.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_512": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "redact_document_instructor_llmnode_512_system_0": "@prompts/redact-document_redact-sensitive-data_system.md",
    "redact_document_instructor_llmnode_512_user_1": "@prompts/redact-document_redact-sensitive-data_user.md"
  },
  "modelConfigs": {
    "redact_document_instructor_llmnode_512_generative_model_name": "@model-configs/redact-document_redact-sensitive-data.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "InstructorLLMNode_512",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "schema": "{\"type\":\"object\",\"properties\":{\"redacted_document\":{\"type\":\"string\"},\"safe_to_index\":{\"type\":\"boolean\"},\"redactions\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"placeholder\":{\"type\":\"string\"},\"category\":{\"type\":\"string\"},\"type\":{\"type\":\"string\"},\"masked_original\":{\"type\":\"string\"},\"reason\":{\"type\":\"string\"}},\"required\":[\"placeholder\",\"category\",\"type\",\"masked_original\"]}},\"notes\":{\"type\":\"string\"}},\"required\":[\"redacted_document\",\"safe_to_index\",\"redactions\"]}",
        "prompts": [
          {
            "id": "c4d02e3f-6a71-4e82-8b93-2d4e5f6a7b80",
            "role": "system",
            "content": "@prompts/redact-document_redact-sensitive-data_system.md"
          },
          {
            "id": "c4d02e3f-6a71-4e82-8b93-2d4e5f6a7b81",
            "role": "user",
            "content": "@prompts/redact-document_redact-sensitive-data_user.md"
          }
        ],
        "nodeName": "Redact Sensitive Data",
        "generativeModelName": "@model-configs/redact-document_redact-sensitive-data.ts"
      }
    }
  },
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"document\": \"string\",\n  \"policy\": \"string\"\n}"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\"result\":\"{{InstructorLLMNode_512.output}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_512",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_512",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_512-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_512",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
