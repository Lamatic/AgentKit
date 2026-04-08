// Flow: advertisement-poster-generation
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Advertisement Poster Generation",
  "description": "This intakes an image to provide analysis and advertisement poster as the output using multimodal and image generation models",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/advertisement-poster-generation",
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
    "advertisement_poster_generation_multi_modal_system": "@prompts/advertisement-poster-generation_multi-modal_system.md",
    "advertisement_poster_generation_generate_image_user": "@prompts/advertisement-poster-generation_generate-image_user.md"
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
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "headers": "",
        "retries": "0",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": "{\n  \"imageURL\": \"string\"\n}"
      }
    }
  },
  {
    "id": "multiModalLLMNode_392",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "multiModalLLMNode",
      "modes": {},
      "values": {
        "nodeName": "Multi Modal",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/advertisement-poster-generation_multi-modal_system.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "attachments": "{{triggerNode_1.output.imageURL}}",
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "ImageGenNode_223",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "ImageGenNode",
      "modes": {},
      "values": {
        "nodeName": "Generate Image",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "user",
            "content": "@prompts/advertisement-poster-generation_generate-image_user.md"
          }
        ],
        "imageGenModelName": ""
      }
    }
  },
  {
    "id": "graphqlResponseNode_868",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"insights\": \"{{multiModalLLMNode_392.output.generatedResponse}}\",\n  \"image\": \"{{ImageGenNode_223.output.imageUrl}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-multiModalLLMNode_392",
    "source": "triggerNode_1",
    "target": "multiModalLLMNode_392",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "multiModalLLMNode_392-ImageGenNode_223",
    "source": "multiModalLLMNode_392",
    "target": "ImageGenNode_223",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "ImageGenNode_223-graphqlResponseNode_868",
    "source": "ImageGenNode_223",
    "target": "graphqlResponseNode_868",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_868",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_868",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
