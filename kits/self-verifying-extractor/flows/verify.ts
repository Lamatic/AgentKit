/*
 * # Verify (the core of the agent)
 * Stage 2 of the Self-Verifying Document Extractor — and the reason this kit
 * exists. It runs as a SEPARATE reasoning pass from `extract`, so it can
 * genuinely disagree with the extractor rather than rubber-stamp it. For each
 * extracted field it must locate an exact supporting span in the source text;
 * if it cannot, the field is marked `unsupported`. It is forbidden from
 * inferring, calculating, or reasoning toward a value — only direct textual
 * support counts. Vague support yields low confidence and an `ambiguous`
 * verdict, never a confident pass.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `document` | `string` | Yes | The original source text (the ground truth). |
 * | `extraction` | `string` | Yes | JSON-stringified fields produced by the `extract` flow. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `verifications` | `array` | One verdict per field: `{ field, value, verdict, confidence, source_quote, reason }`. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (graphqlNode) — trigger; supplies `document` and `extraction`.
 * 2. `Verify Fields` (LLMNode) — adversarial grounding pass; emits a JSON array.
 * 3. `API Response` (graphqlResponseNode) — maps the model's JSON array to `verifications`.
 */

// Flow: verify

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Verify",
  "description":
    "Stage 2 — independently grounds each extracted field to an exact span of the source text, scoring confidence and flagging anything it cannot prove.",
  "tags": ["verification", "grounding", "documents"],
  "testInput": {
    "document":
      "INVOICE #A-2231\nFrom: Brightline Studios\nBill To: Acme Co.\nTotal Due: $1,240.00\nDue Date: 03/18/2026\nTerms: Net 30. A late fee of 1.5% per month applies after the due date.",
    "extraction":
      "{\"document_type\":\"INVOICE\",\"vendor_or_sender\":\"Brightline Studios\",\"total_amount\":\"$1,240.00\",\"due_date\":\"03/15/2026\",\"account_or_invoice_number\":\"#A-2231\",\"key_terms\":[\"Net 30\",\"1.5% per month\"]}",
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
    "verify_verify_fields_system": "@prompts/verify_verify-fields_system.md",
    "verify_verify_fields_user": "@prompts/verify_verify-fields_user.md",
  },
  "modelConfigs": {
    "verify_verify_fields": "@model-configs/verify_verify-fields.ts",
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
        "advance_schema":
          "{\n  \"document\": \"string\",\n  \"extraction\": \"string\"\n}",
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
        "nodeName": "Verify Fields",
        "tools": [],
        "prompts": [
          {
            "id": "c2b6f4d3-1111-4a2b-9c31-verify-system",
            "role": "system",
            "content": "@prompts/verify_verify-fields_system.md",
          },
          {
            "id": "c2b6f4d3-2222-4a2b-9c31-verify-user",
            "role": "user",
            "content": "@prompts/verify_verify-fields_user.md",
          },
        ],
        "memories": "@model-configs/verify_verify-fields.ts",
        "messages": "@model-configs/verify_verify-fields.ts",
        "generativeModelName": "@model-configs/verify_verify-fields.ts",
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
          "{\n  \"verifications\": \"{{LLMNode_10.output.generatedResponse}}\"\n}",
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
    "id": "LLMNode_10-graphqlResponseNode_30",
    "source": "LLMNode_10",
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
