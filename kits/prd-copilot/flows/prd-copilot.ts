// Flow: prd-copilot
// Extracted flow nodes and edges for Lamatic Studio validation.

export const meta = {
  "name": "PRD Copilot - Generate & Refine",
  "description": "Drafts and refines a Product Requirement Document (PRD) and generates a Mermaid flowchart",
  "tags": ["agentic", "prd", "mermaid"],
  "testInput": {
    "mode": "draft",
    "instructions": "A dog walking application"
  }
};

export const inputs = {};
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "draft_prd_system": "@prompts/draft_prd_system.md",
    "refine_prd_system": "@prompts/refine_prd_system.md"
  },
  "modelConfigs": {
    "draft_prd": "@model-configs/draft_prd.ts",
    "refine_prd": "@model-configs/refine_prd.ts"
  }
};

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
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_397",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Draft PRD Node",
        "tools": [],
        "prompts": [
          {
            "id": "prompt-draft-id",
            "role": "system",
            "content": "@prompts/draft_prd_system.md"
          }
        ],
        "memories": "@model-configs/draft_prd.ts",
        "messages": "@model-configs/draft_prd.ts",
        "generativeModelName": "@model-configs/draft_prd.ts"
      }
    }
  },
  {
    "id": "LLMNode_834",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Refine PRD Node",
        "tools": [],
        "prompts": [
          {
            "id": "prompt-refine-id",
            "role": "system",
            "content": "@prompts/refine_prd_system.md"
          }
        ],
        "memories": "@model-configs/refine_prd.ts",
        "messages": "@model-configs/refine_prd.ts",
        "generativeModelName": "@model-configs/refine_prd.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_397.output}}{{LLMNode_834.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_397",
    "source": "triggerNode_1",
    "target": "LLMNode_397",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_397-LLMNode_834",
    "source": "LLMNode_397",
    "target": "LLMNode_834",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_834-graphqlResponseNode_2",
    "source": "LLMNode_834",
    "target": "graphqlResponseNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_2",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_2",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
