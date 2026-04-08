// Flow: get-started-with-google-sheet
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Get Started with Google Sheet",
  "description": "This flow introduces the Google Sheets trigger node and a RAG node which helps users ask questions and perform analysis on a Google Sheet. The flow guides users through the process of connecting to Google Sheets and leveraging the RAG node for interactive data exploration.",
  "tags": [
    "📱 Apps",
    "🚀 Startup",
    "🛢️ Database"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/get-started-with-google-sheet",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "get_started_with_google_sheet_generate_text_system": "@prompts/get-started-with-google-sheet_generate-text_system.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "googleSheetsNode",
      "modes": {
        "sheetName": "list"
      },
      "trigger": true,
      "values": {
        "nodeName": "Google Sheets",
        "syncMode": "incremental_append",
        "batchSize": "200",
        "credentials": "",
        "cronExpression": "0 0 00 1/1 * ? * UTC",
        "namesConversion": "false",
        "spreadSheetLink": "https://docs.google.com/spreadsheets/d/1wCDFdkWMvHtOqiGt6P2Dc1Br5MSnd03-dZL7QannzDM/edit?usp=sharing"
      }
    }
  },
  {
    "id": "LLMNode_420",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/get-started-with-google-sheet_generate-text_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "addNode_105",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {
        "nodeName": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_420",
    "source": "triggerNode_1",
    "target": "LLMNode_420",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_420-addNode_105",
    "source": "LLMNode_420",
    "target": "addNode_105",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
