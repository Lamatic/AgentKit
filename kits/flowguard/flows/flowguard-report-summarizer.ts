/*
 * # FlowGuard — Report Summarizer Flow
 * Turns aggregated run stats + worst failures + baseline deltas into a short,
 * honest executive summary (Markdown) an engineer can act on in 30 seconds.
 *
 * ## Inputs (trigger schema)
 * | Field | Type | Description |
 * |---|---|---|
 * | `verdict` | string | IMPROVED / NO_CHANGE / REGRESSED / NONE. |
 * | `totals` | string | JSON of run totals. |
 * | `worstFailures` | string | JSON array of the worst-scoring cases. |
 * | `baselineDeltas` | string | JSON of per-case deltas (empty if no baseline). |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `summaryMarkdown` | string | The executive summary in Markdown. |
 *
 * ## Node Walkthrough
 * 1. `API Request` (triggerNode / graphqlNode) — four input fields.
 * 2. `Summarize` (InstructorLLMNode) — writes the Markdown summary, low temp.
 * 3. `API Response` (responseNode) — returns `summaryMarkdown`.
 */

// Flow: flowguard-report-summarizer

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "FlowGuard Report Summarizer",
  "description": "Turns run stats and failures into an executive summary in Markdown.",
  "tags": ["flowguard", "evaluation", "reporting"],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_report": [
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "flowguard_report_summarizer_summarize_system": "@prompts/flowguard-report-summarizer_summarize_system.md",
    "flowguard_report_summarizer_summarize_user": "@prompts/flowguard-report-summarizer_summarize_user.md"
  },
  "scripts": {},
  "modelConfigs": {
    "flowguard_report_summarizer_summarize": "@model-configs/flowguard-report-summarizer_summarize.ts"
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
        "advance_schema": "{\n  \"verdict\": \"string\",\n  \"totals\": \"string\",\n  \"worstFailures\": \"string\",\n  \"baselineDeltas\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 0 },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_report",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_report",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summaryMarkdown\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "rp-sys",
            "role": "system",
            "content": "@prompts/flowguard-report-summarizer_summarize_system.md"
          },
          {
            "id": "rp-usr",
            "role": "user",
            "content": "@prompts/flowguard-report-summarizer_summarize_user.md"
          }
        ],
        "memories": "@model-configs/flowguard-report-summarizer_summarize.ts",
        "messages": "@model-configs/flowguard-report-summarizer_summarize.ts",
        "nodeName": "Summarize",
        "attachments": "@model-configs/flowguard-report-summarizer_summarize.ts",
        "generativeModelName": "@model-configs/flowguard-report-summarizer_summarize.ts"
      }
    },
    "type": "dynamicNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 130 },
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
        "outputMapping": "{\n  \"summaryMarkdown\": \"{{InstructorLLMNode_report.output.summaryMarkdown}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": { "width": 216, "height": 93 },
    "position": { "x": 0, "y": 260 },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_report",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_report",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_report-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_report",
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
