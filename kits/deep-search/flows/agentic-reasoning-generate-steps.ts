// Flow: agentic-reasoning-generate-steps

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Agentic Reasoning - Generate Steps",
  "description": "This flow generates steps / actions to be performed as part of Agentic Reasoning",
  "tags": [],
  "testInput": {
    "query": "Help me pack for my trip to Jaipur next week",
    "history": []
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_680": [
    {
      "mode": "chat",
      "name": "generativeModelName",
      "type": "model",
      "label": "Generative Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "generator/text",
      "description": "Select the model to generate text based on the prompt.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_text_system": "@prompts/generate-text-system.md",
    "agentic_reasoning_generate_steps_generate_text_user": "@prompts/agentic-reasoning-generate-steps_generate-text_user.md"
  },
  "modelConfigs": {
    "agentic_reasoning_generate_steps_generate_text": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts"
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
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "headers": "",
        "retries": "0",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_680",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "modes": {},
      "values": {
        "nodeName": "Generate Text",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-reasoning-generate-steps_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts",
        "messages": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts",
        "attachments": "@model-configs/agentic-reasoning-generate-steps_generate-text.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"steps\": \"{{LLMNode_680.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_680",
    "source": "triggerNode_1",
    "target": "LLMNode_680",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_680-responseNode_triggerNode_1",
    "source": "LLMNode_680",
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
