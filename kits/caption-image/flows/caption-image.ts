// Flow: caption-image

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Caption Image",
  "description": "This API accepts an image and metadata, then uses the image content to generate a caption. It enables systematic, consistent, and efficient captioning of large numbers of photographs, screenshots, or other images.",
  "tags": [
    "✨ Generative"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/caption-image",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "caption_image_multi_modal": "@model-configs/caption-image_multi-modal.ts"
  },
  "triggers": {
    "caption_image_caption_ss_trigger": "@triggers/webhooks/caption-image_caption-ss-trigger.ts"
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
        "nodeName": "Caption SS Trigger",
        "responeType": "@triggers/webhooks/caption-image_caption-ss-trigger.ts",
        "advance_schema": "@triggers/webhooks/caption-image_caption-ss-trigger.ts"
      }
    }
  },
  {
    "id": "multiModalLLMNode_435",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "multiModalLLMNode",
      "values": {
        "nodeName": "Multi Modal",
        "messages": "@model-configs/caption-image_multi-modal.ts",
        "attachments": "@model-configs/caption-image_multi-modal.ts",
        "systemPrompt": "You are a Photographer who captions photographs.",
        "promptTemplate": "\r\nYou are a photo editor. Your job is to produce a concise, descriptive and compelling\r\ncaption that helps someone understand what is in this attached photo without viewing it: {{triggerNode_1.output.photo}}\r\nPlease use the following contextual elements to produce the best possible caption:\r\n1) Timestamp which contains the date and time the photo was taken: {{triggerNode_1.output.timestamp}}\r\n2) The location where the photo was taken: {{triggerNode_1.output.location}}\r\n3) The people shown in the photograph: {{triggerNode_1.output.people}}{{triggerNode_1.output.people}}\r\nThe caption you produce should:\r\n1) Reflect the mood depicted in the photograph.\r\n2) It should be different than other photographs that you've captioned.\r\n3) For photographs that are extremely similar, attempt to select the best photo and \r\nadd \"duplicate\" at the end of the name of the others.\r\n4) It should not exceed 50 characters.",
        "generativeModelName": "@model-configs/caption-image_multi-modal.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_185",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "outputMapping": "{\n  \"Caption\": \"{{multiModalLLMNode_435.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-multiModalLLMNode_435",
    "source": "triggerNode_1",
    "target": "multiModalLLMNode_435",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "multiModalLLMNode_435-graphqlResponseNode_185",
    "source": "multiModalLLMNode_435",
    "target": "graphqlResponseNode_185",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_185",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_185",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
