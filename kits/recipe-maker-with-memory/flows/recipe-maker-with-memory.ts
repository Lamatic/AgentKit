// Flow: recipe-maker-with-memory
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Recipe Maker with Memory",
  "description": "This AI-powered recipe generation system retains user preferences, dietary restrictions, and past interactions to generate personalised recipes with customised cooking instructions tailored to individual needs.",
  "tags": [
    "✨ Generative",
    "🛠️ Tools"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/recipe-maker-with-memory",
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
    "recipe_maker_with_memory_generate_text_system": "@prompts/recipe-maker-with-memory_generate-text_system.md"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"query\": \"string\",\n  \"id\": \"int\"\n}"
      }
    }
  },
  {
    "id": "memoryNode_396",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "nodeName": "Memory Add",
        "uniqueId": "{{triggerNode_1.output.id}}",
        "sessionId": "",
        "memoryValue": [
          {
            "role": "user",
            "content": "{{triggerNode_1.output.query}}"
          }
        ],
        "memoryCollection": "receipeTest",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "memoryRetrieveNode_711",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "nodeName": "Memory Retrieve",
        "limit": 10,
        "filters": "[]",
        "searchQuery": "What are the user preferences and what all have they told about their needs?",
        "memoryCollection": "receipeTest",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "LLMNode_730",
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
            "content": "@prompts/recipe-maker-with-memory_generate-text_system.md"
          }
        ],
        "memories": "{{memoryRetrieveNode_711.output.memories}}",
        "messages": "[]",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "graphqlResponseNode_127",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"recipe\": \"{{LLMNode_730.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-memoryNode_396",
    "source": "triggerNode_1",
    "target": "memoryNode_396",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_396-memoryRetrieveNode_711",
    "source": "memoryNode_396",
    "target": "memoryRetrieveNode_711",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_711-LLMNode_730",
    "source": "memoryRetrieveNode_711",
    "target": "LLMNode_730",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_730-graphqlResponseNode_127",
    "source": "LLMNode_730",
    "target": "graphqlResponseNode_127",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_127",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_127",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
