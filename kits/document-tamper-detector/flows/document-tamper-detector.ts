/*
 * # Document Tamper Detector
 *
 * A document authenticity triage agent that detects signs of digital tampering
 * in uploaded PDFs and images, returning a structured trust report.
 *
 * ## Purpose
 * This flow accepts a base64-encoded document (PDF, JPEG, or PNG) and runs four
 * tiered detection signals against it, combining cheap heuristics with an
 * optional VLM (vision LLM) pass on already-flagged regions. The output is a
 * structured JSON trust report with a 0–100 risk score, per-flag plain-language
 * explanations, and a standard disclaimer.
 *
 * The flow is designed to be the backend for a Next.js web UI that accepts
 * document uploads, but it is equally useful as a standalone API endpoint for
 * automated document verification pipelines.
 *
 * ## Detection Signals (in execution order)
 * 1. **Metadata Inspection** (weight 30%) — PDF Info dict / JPEG EXIF analysis
 * 2. **OCR Font/Spacing Analysis** (weight 30%) — statistical outlier detection on bounding boxes
 * 3. **Error Level Analysis** (weight 25%) — JPEG/PNG compression structure inspection
 * 4. **VLM Visual Anomaly Pass** (weight 15%) — vision LLM run only on flagged regions
 *
 * ## When To Use
 * - When a freelancer, HR professional, or landlord needs a fast first-pass check
 *   on an uploaded document (invoice, offer letter, payslip, ID, income proof)
 * - When an automated pipeline needs a tamper-risk score before processing a document
 * - When you want to reduce the attack surface of document-based fraud at intake
 *
 * ## When Not To Use
 * - Do not use as a definitive legal or forensic determination — use as triage only
 * - Do not use for documents that are critical enough to require certified forensic review
 * - Do not pass documents with PII through this flow without ensuring appropriate data handling
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `fileBase64` | `string` | Yes | Base64-encoded document content (with or without data URL prefix) |
 * | `fileName` | `string` | Yes | Original filename for context (e.g. "invoice_march.pdf") |
 * | `fileType` | `string` | Yes | MIME type: "application/pdf", "image/jpeg", or "image/png" |
 * | `ocrBoxes` | `array` | No | Optional pre-computed OCR bounding boxes (enables Signal 2) |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `trustReport` | `object` | The full trust report (see schema in report-assembler.ts) |
 *
 * ## Dependencies
 * - `DOCUMENT_TAMPER_DETECTOR_FLOW_ID` — deployed flow ID (used by the Next.js app)
 * - `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY` — Lamatic credentials
 * - A vision-capable LLM (e.g. GPT-4o) configured in Lamatic for the VLM node
 *
 * ## Error Scenarios
 * | Symptom | Likely Cause | Fix |
 * |---|---|---|
 * | Risk score is always 0 | No flags raised by any signal | Check that fileBase64 is valid and fileType is correct |
 * | VLM node returns empty flags | LLM not configured or quota exceeded | Configure a vision-capable model in Lamatic Studio |
 * | OCR flags never appear | ocrBoxes not provided in payload | Include ocrBoxes from a pytesseract pre-processing step |
 * | Flow times out | Large document + VLM latency | Use smaller documents or increase flow timeout in Studio |
 */

// Flow: document-tamper-detector

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Document Tamper Detector",
  "description": "Detects signs of digital tampering in uploaded PDF and image documents, returning a structured trust report with risk score, flagged regions, and plain-language explanations.",
  "tags": ["document", "security", "forensics", "vision", "tamper-detection"],
  "testInput": {
    "fileBase64": "JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooSGVsbG8sIFdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago=",
    "fileName": "sample.pdf",
    "fileType": "application/pdf",
    "ocrBoxes": []
  },
  "githubUrl": "https://github.com/Taukeer1256/AgentKit/tree/main/kits/document-tamper-detector",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_vlm": [
    {
      "name": "generativeModelName",
      "label": "Vision LLM Model",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select a vision-capable model (e.g. GPT-4o) for the visual anomaly assessment pass.",
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "vlm_system": "@prompts/document-tamper-detector_vlm-assessor_system.md",
    "vlm_user": "@prompts/document-tamper-detector_vlm-assessor_user.md"
  },
  "modelConfigs": {
    "vlm_assessor": "@model-configs/document-tamper-detector_vlm-assessor.ts"
  },
  "scripts": {
    "metadata_inspector": "@scripts/document-tamper-detector_metadata-inspector.ts",
    "ocr_analyzer": "@scripts/document-tamper-detector_ocr-analyzer.ts",
    "ela_analyzer": "@scripts/document-tamper-detector_ela-analyzer.ts",
    "report_assembler": "@scripts/document-tamper-detector_report-assembler.ts"
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
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 0 },
    "selected": false
  },
  {
    "id": "codeNode_metadata",
    "data": {
      "label": "Metadata Inspector",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-tamper-detector_metadata-inspector.ts",
        "nodeName": "Metadata Inspector"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 150 },
    "selected": false
  },
  {
    "id": "codeNode_ocr",
    "data": {
      "label": "OCR Font Analyzer",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-tamper-detector_ocr-analyzer.ts",
        "nodeName": "OCR Font Analyzer"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 300 },
    "selected": false
  },
  {
    "id": "codeNode_ela",
    "data": {
      "label": "ELA Analyzer",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-tamper-detector_ela-analyzer.ts",
        "nodeName": "ELA Analyzer"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 450 },
    "selected": false
  },
  {
    "id": "LLMNode_vlm",
    "data": {
      "label": "VLM Anomaly Assessor",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "vlm-system-prompt",
            "role": "system",
            "content": "@prompts/document-tamper-detector_vlm-assessor_system.md"
          },
          {
            "id": "vlm-user-prompt",
            "role": "user",
            "content": "@prompts/document-tamper-detector_vlm-assessor_user.md"
          }
        ],
        "memories": "@model-configs/document-tamper-detector_vlm-assessor.ts",
        "messages": "@model-configs/document-tamper-detector_vlm-assessor.ts",
        "nodeName": "VLM Anomaly Assessor",
        "attachments": "@model-configs/document-tamper-detector_vlm-assessor.ts",
        "credentials": "@model-configs/document-tamper-detector_vlm-assessor.ts",
        "generativeModelName": "@model-configs/document-tamper-detector_vlm-assessor.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 600 },
    "selected": false
  },
  {
    "id": "codeNode_report",
    "data": {
      "label": "Report Assembler",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-tamper-detector_report-assembler.ts",
        "nodeName": "Report Assembler"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 750 },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"trustReport\": \"{{codeNode_report.output}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": { "width": 218, "height": 95 },
    "position": { "x": 600, "y": 900 },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_metadata",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_metadata",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_metadata-codeNode_ocr",
    "type": "defaultEdge",
    "source": "codeNode_metadata",
    "target": "codeNode_ocr",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_ocr-codeNode_ela",
    "type": "defaultEdge",
    "source": "codeNode_ocr",
    "target": "codeNode_ela",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_ela-LLMNode_vlm",
    "type": "defaultEdge",
    "source": "codeNode_ela",
    "target": "LLMNode_vlm",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_vlm-codeNode_report",
    "type": "defaultEdge",
    "source": "LLMNode_vlm",
    "target": "codeNode_report",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_report-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_report",
    "target": "responseNode_triggerNode_1",
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
