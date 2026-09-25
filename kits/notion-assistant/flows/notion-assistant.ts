/*
 * # Notion Assistant
 * This flow accepts natural language requests, questions, or notes, and translates them into structured Notion workspace actions, search filters, and block trees.
 *
 * ## Purpose
 * Automates Notion workspace interactions by processing user instructions and generating verified Notion API payloads for page creation, database updates, and workspace summaries.
 *
 * ## Inputs
 * | Field | Type | Required | Description |
 * |---|---|---|---|
 * | `query` | `string` | Yes | The natural language command, question, or notes content. |
 * | `actionType` | `string` | No | Optional explicit action ("search", "create_page", "update_database", "summarize", "auto"). |
 * | `targetDatabase` | `string` | No | Target database or parent page name/ID. |
 * | `contextData` | `string` | No | Additional context, existing notes, or pre-fetched JSON data. |
 *
 * ## Outputs
 * | Field | Type | Description |
 * |---|---|---|
 * | `action` | `string` | Identified action type. |
 * | `summary` | `string` | Human-readable explanation of the generated action. |
 * | `notionPayload` | `string` | Structured JSON block/property tree ready for Notion API. |
 * | `status` | `string` | Execution status ("success" or "clarification_needed"). |
 * | `suggestions` | `string` | Recommended follow-up actions. |
 */

// Flow: notion-assistant

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Notion Assistant",
  "description": "An AI-powered Notion assistant that understands workspace queries, searches pages, organizes notes, and automates page and database item creation.",
  "tags": [
    "✨ Generative",
    "🛠️ Developer Tools",
    "⚡ Productivity"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/notion-assistant",
  "author": {
    "name": "Vimal",
    "email": "vimalsahani2005@gmail.com"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  query: { type: "string", required: true },
  actionType: { type: "string", required: false },
  targetDatabase: { type: "string", required: false },
  contextData: { type: "string", required: false }
};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "notion_assistant_generate_action_user": "@prompts/notion-assistant_generate-action_user.md",
    "notion_assistant_generate_action_system": "@prompts/notion-assistant_generate-action_system.md"
  },
  "modelConfigs": {
    "notion_assistant_generate_action": "@model-configs/notion-assistant_generate-action.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"query\": {\n      \"type\": \"string\"\n    },\n    \"actionType\": {\n      \"type\": \"string\"\n    },\n    \"targetDatabase\": {\n      \"type\": \"string\"\n    },\n    \"contextData\": {\n      \"type\": \"string\"\n    }\n  },\n  \"required\": [\n    \"query\"\n  ]\n}"
      }
    }
  },
  {
    "id": "LLMNode_180",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Notion Action",
        "tools": [],
        "prompts": [
          {
            "id": "310ae7d9-b31f-4065-bbae-3363983ce4aa",
            "role": "user",
            "content": "@prompts/notion-assistant_generate-action_user.md"
          },
          {
            "id": "420c2f4b-c23d-4545-abef-73dc897d6cbb",
            "role": "system",
            "content": "@prompts/notion-assistant_generate-action_system.md"
          }
        ],
        "memories": "@model-configs/notion-assistant_generate-action.ts",
        "messages": "@model-configs/notion-assistant_generate-action.ts",
        "generativeModelName": "@model-configs/notion-assistant_generate-action.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_680",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"result\": \"{{LLMNode_180.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_180",
    "source": "triggerNode_1",
    "target": "LLMNode_180",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_180-graphqlResponseNode_680",
    "source": "LLMNode_180",
    "target": "graphqlResponseNode_680",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_680",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_680",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
