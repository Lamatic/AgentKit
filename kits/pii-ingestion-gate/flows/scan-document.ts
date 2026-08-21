/*
 * # Scan Document
 * Scans a document for PII, credentials, and confidential data before RAG
 * ingestion, and returns a severity-scored risk report with a clear verdict.
 *
 * ## Purpose
 * Once a document is embedded into a vector index, any PII inside it leaks
 * through every retrieval and chat response — and removing it after the fact
 * is close to impossible. This flow is the "gate" in front of that index:
 * it inspects the raw text, classifies every sensitive span it finds, and
 * returns a machine-readable verdict (`safe` / `needs_redaction` / `blocked`)
 * that an ingestion pipeline can act on automatically.
 *
 * ## When To Use
 * - Before vectorizing any document from an untrusted or mixed source
 *   (uploads, drive syncs, scraped pages, support tickets).
 * - As a compliance checkpoint (GDPR / SOC 2) in an automated RAG pipeline.
 * - To audit an existing corpus by re-running documents through the gate.
 *
 * ## When Not To Use
 * - Not a replacement for redaction — pair it with the `redact-document`
 *   flow when the verdict is `needs_redaction`.
 * - Not for binary files (images, PDFs) — extract text first.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `document` | `string` | Yes | Raw text of the document to scan. |
 * | `policy` | `string` | No | Optional ingestion policy, e.g. "internal emails are acceptable, credentials are never acceptable". |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `analysis` | `object` | Structured scan result: `verdict`, `risk_score` (0-100), `summary`, `findings[]` (category, type, severity, masked_value, context, recommendation), `counts`. |
 * | `report` | `string` | Human-readable markdown audit summary generated from the analysis. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (`graphqlNode`) — receives `document` and optional `policy`.
 * 2. `Detect Sensitive Data` (`InstructorLLMNode`) — classifies every
 *    sensitive span into a strict JSON schema. Values are always masked
 *    (first 2 chars + asterisks); raw sensitive values never appear in the
 *    output. Verdict rules: any critical → blocked, any high/medium →
 *    needs_redaction, else safe.
 * 3. `Write Audit Summary` (`LLMNode`) — turns the structured analysis into
 *    a short markdown report suitable for a reviewer or an audit log.
 * 4. `API Response` — returns `{ analysis, report }`.
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Recommended Fix |
 * |---|---|---|
 * | Empty findings on a document with obvious PII | Model too weak or prompts modified | Use a strong text model (e.g. gpt-4o-mini, gemini-2.5-flash) and keep the system prompt intact. |
 * | Verdict missing or malformed | Schema removed from the Instructor node | Re-add the JSON schema on `Detect Sensitive Data`. |
 * | Flow fails at LLM node | Missing provider credentials | Configure a model + credential in the node's model config. |
 */

// Flow: scan-document

// -- Meta --
export const meta = {
  "name": "Scan Document",
  "description": "Scan a document for PII, credentials, and confidential data before RAG ingestion. Returns a severity-scored risk report and a safe / needs_redaction / blocked verdict.",
  "tags": ["security", "privacy", "rag", "compliance"],
  "testInput": "{\"document\":\"Meeting notes 2026-07-01\\nAttendees: John Smith (john.smith@acme.com, +1 415-555-0132)\\nAction: rotate prod key sk-live-9f8a7b6c5d4e3f2a1b0c\\nCustomer SSN on file: 523-45-6789\\nBudget approved: $250k\",\"policy\":\"Internal names are acceptable. Credentials and government IDs are never acceptable.\"}",
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
  "InstructorLLMNode_301": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_642": [
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
    "scan_document_instructor_llmnode_301_system_0": "@prompts/scan-document_detect-sensitive-data_system.md",
    "scan_document_instructor_llmnode_301_user_1": "@prompts/scan-document_detect-sensitive-data_user.md",
    "scan_document_llmnode_642_system_0": "@prompts/scan-document_write-audit-summary_system.md",
    "scan_document_llmnode_642_user_1": "@prompts/scan-document_write-audit-summary_user.md"
  },
  "modelConfigs": {
    "scan_document_instructor_llmnode_301_generative_model_name": "@model-configs/scan-document_detect-sensitive-data.ts",
    "scan_document_llmnode_642_generative_model_name": "@model-configs/scan-document_write-audit-summary.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "InstructorLLMNode_301",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "schema": "{\"type\":\"object\",\"properties\":{\"verdict\":{\"type\":\"string\",\"enum\":[\"safe\",\"needs_redaction\",\"blocked\"]},\"risk_score\":{\"type\":\"number\"},\"summary\":{\"type\":\"string\"},\"findings\":{\"type\":\"array\",\"items\":{\"type\":\"object\",\"properties\":{\"category\":{\"type\":\"string\"},\"type\":{\"type\":\"string\"},\"severity\":{\"type\":\"string\"},\"masked_value\":{\"type\":\"string\"},\"context\":{\"type\":\"string\"},\"recommendation\":{\"type\":\"string\"}},\"required\":[\"category\",\"type\",\"severity\",\"masked_value\"]}},\"counts\":{\"type\":\"object\",\"properties\":{\"critical\":{\"type\":\"number\"},\"high\":{\"type\":\"number\"},\"medium\":{\"type\":\"number\"},\"low\":{\"type\":\"number\"}}}},\"required\":[\"verdict\",\"risk_score\",\"summary\",\"findings\",\"counts\"]}",
        "prompts": [
          {
            "id": "b3a91c2e-5f60-4d71-9a82-1c3d4e5f6a70",
            "role": "system",
            "content": "@prompts/scan-document_detect-sensitive-data_system.md"
          },
          {
            "id": "b3a91c2e-5f60-4d71-9a82-1c3d4e5f6a71",
            "role": "user",
            "content": "@prompts/scan-document_detect-sensitive-data_user.md"
          }
        ],
        "nodeName": "Detect Sensitive Data",
        "generativeModelName": "@model-configs/scan-document_detect-sensitive-data.ts"
      }
    }
  },
  {
    "id": "LLMNode_642",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "prompts": [
          {
            "id": "b3a91c2e-5f60-4d71-9a82-1c3d4e5f6a72",
            "role": "system",
            "content": "@prompts/scan-document_write-audit-summary_system.md"
          },
          {
            "id": "b3a91c2e-5f60-4d71-9a82-1c3d4e5f6a73",
            "role": "user",
            "content": "@prompts/scan-document_write-audit-summary_user.md"
          }
        ],
        "nodeName": "Write Audit Summary",
        "generativeModelName": "@model-configs/scan-document_write-audit-summary.ts"
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
        "outputMapping": "{\"analysis\":\"{{InstructorLLMNode_301.output}}\",\"report\":\"{{LLMNode_642.output.generatedResponse}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_301",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_301-LLMNode_642",
    "source": "InstructorLLMNode_301",
    "target": "LLMNode_642",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_642-responseNode_triggerNode_1",
    "source": "LLMNode_642",
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
