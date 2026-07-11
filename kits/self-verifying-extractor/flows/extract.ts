/*
 * # Extract
 * Stage 1 of the Self-Verifying Document Extractor. Reads an everyday document
 * (invoice, bill, receipt, financial snippet, or short contract) and returns a fixed set of fields
 * as structured JSON. This stage does NOT verify anything — it is the ordinary,
 * confident extraction pass that the downstream `verify` flow independently
 * checks. Keep it lean; the intelligence of the agent lives in verification.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `document` | `string` | Yes | The raw text of the document to extract from. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `extraction` | `object` | Fields pulled from the document (document_type, vendor_or_sender, total_amount, due_date, account_or_invoice_number, key_terms[]). |
 *
 * ## Node Walkthrough
 * 1. `API Request` (graphqlNode) — trigger; supplies `document`.
 * 2. `Extract Fields` (LLMNode) — reads the document, emits a JSON string of fields.
 * 3. `Parse JSON` (codeNode) — parses the string into an object under `extraction`.
 * 4. `API Response` (graphqlResponseNode) — returns `extraction`.
 */

// Flow: extract

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Extract",
  "description":
    "Stage 1 — pulls a fixed set of fields out of an everyday document and returns them as structured JSON, with no verification.",
  "tags": ["extraction", "documents"],
  "testInput": {
    "document":
      "INVOICE #A-2231\nFrom: Brightline Studios\nBill To: Acme Co.\nTotal Due: $1,240.00\nDue Date: 03/18/2026\nTerms: Net 30. A late fee of 1.5% per month applies after the due date.",
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": { "name": "Krishhiv Mehra", "email": "krishhiv@gmail.com" },
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md",
  },
  "prompts": {
    "extract_extract_fields_system": "@prompts/extract_extract-fields_system.md",
    "extract_extract_fields_user": "@prompts/extract_extract-fields_user.md",
  },
  "modelConfigs": {
    "extract_extract_fields": "@model-configs/extract_extract-fields.ts",
  },
  "scripts": {
    "extract_parse_json": "@scripts/extract_parse-json.ts",
  },
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"document\": \"string\"\n}",
      },
    },
  },
  {
    "id": "LLMNode_10",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Extract Fields",
        "tools": [],
        "prompts": [
          {
            "id": "b1a5f3c2-1111-4a2b-9c31-extract-system",
            "role": "system",
            "content": "@prompts/extract_extract-fields_system.md",
          },
          {
            "id": "b1a5f3c2-2222-4a2b-9c31-extract-user",
            "role": "user",
            "content": "@prompts/extract_extract-fields_user.md",
          },
        ],
        "memories": "@model-configs/extract_extract-fields.ts",
        "messages": "@model-configs/extract_extract-fields.ts",
        "generativeModelName": "@model-configs/extract_extract-fields.ts",
      },
    },
  },
  {
    "id": "codeNode_20",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Parse JSON",
        "code": "@scripts/extract_parse-json.ts",
      },
    },
  },
  {
    "id": "graphqlResponseNode_30",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping":
          "{\n  \"extraction\": \"{{codeNode_20.output.extraction}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_10",
    "source": "triggerNode_1",
    "target": "LLMNode_10",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "LLMNode_10-codeNode_20",
    "source": "LLMNode_10",
    "target": "codeNode_20",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_20-graphqlResponseNode_30",
    "source": "codeNode_20",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "response-graphqlResponseNode_30",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_30",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
