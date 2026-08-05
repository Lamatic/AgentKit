/*
 * # Armchair Tactician
 * This flow accepts a match summary and returns a dramatic, highly tactical football pundit analysis.
 */

// Flow: armchair-tactician

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Armchair Tactician",
  "description": "This workflow generates an overly passionate and dramatic football pundit analysis from match events.",
  "tags": [
    "✨ Generative",
    "📞 Sports",
    "📞 Entertainment"
  ],
  "testInput": {
    "match_summary": "Man City 2-1 Arsenal, Arsenal had a red card in the 30th minute"
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/armchair-tactician",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Football Fanatic",
    "email": "tactics@lamatic.ai"
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
    "armchair_tactician_generate_text_user": "@prompts/armchair-tactician_generate-text_user.md",
    "armchair_tactician_generate_text_system": "@prompts/armchair-tactician_generate-text_system.md"
  },
  "modelConfigs": {
    "armchair_tactician_generate_text": "@model-configs/armchair-tactician_generate-text.ts"
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
        "advance_schema": "{\"type\":\"object\",\"properties\":{\"match_summary\":{\"type\":\"string\"}}}"
      }
    }
  },
  {
    "id": "LLMNode_1",
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
            "id": "1",
            "role": "user",
            "content": "@prompts/armchair-tactician_generate-text_user.md"
          },
          {
            "id": "2",
            "role": "system",
            "content": "@prompts/armchair-tactician_generate-text_system.md"
          }
        ],
        "memories": "@model-configs/armchair-tactician_generate-text.ts",
        "messages": "@model-configs/armchair-tactician_generate-text.ts",
        "generativeModelName": "@model-configs/armchair-tactician_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"analysis\": \"{{LLMNode_1.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_1",
    "source": "triggerNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_1-graphqlResponseNode_1",
    "source": "LLMNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
