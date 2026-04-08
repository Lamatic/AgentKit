// Flow: agentic-generate-content

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Agentic Generation - Generate Content",
  "description": "",
  "tags": [],
  "testInput": {
    "mode": "text",
    "instructions": "write me a poem on AI"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_430": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
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
  ],
  "LLMNode_255": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
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
  ],
  "ImageGenNode_535": [
    {
      "name": "imageGenModelName",
      "label": "Image Model Name",
      "type": "model",
      "mode": "image_generation",
      "description": "Select the image generation model to use based on the prompt.",
      "modelType": "generator/image",
      "required": true,
      "defaultValue": "",
      "isPrivate": true,
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
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
    "text_system": "@prompts/text-system.md",
    "json_system": "@prompts/json-system.md",
    "generate_image_system": "@prompts/generate-image-system.md",
    "agentic_generate_content_text_user": "@prompts/agentic-generate-content_text_user.md",
    "agentic_generate_content_json_user": "@prompts/agentic-generate-content_json_user.md",
    "agentic_generate_content_generate_image_user": "@prompts/agentic-generate-content_generate-image_user.md"
  },
  "modelConfigs": {
    "agentic_generate_content_text": "@model-configs/agentic-generate-content_text.ts",
    "agentic_generate_content_json": "@model-configs/agentic-generate-content_json.ts",
    "agentic_generate_content_generate_image": "@model-configs/agentic-generate-content_generate-image.ts"
  },
  "scripts": {
    "agentic_generate_content_invalid_mode": "@scripts/agentic-generate-content_invalid-mode.ts",
    "agentic_generate_content_parse_json": "@scripts/agentic-generate-content_parse-json.ts",
    "agentic_generate_content_finalise_output": "@scripts/agentic-generate-content_finalise-output.ts"
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
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "conditionNode_374",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_374-addNode_871",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"text\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_374-addNode_908",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_374-plus-node-addNode_619157-178",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"image\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_374-plus-node-addNode_139233-221",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.mode}}\",\n      \"operator\": \"==\",\n      \"value\": \"json\"\n    }\n  ]\n}"
          }
        ]
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "codeNode_567",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_invalid-mode.ts",
        "nodeName": "Invalid Mode"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 900,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "LLMNode_430",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/text-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_text_user.md"
          }
        ],
        "memories": "@model-configs/agentic-generate-content_text.ts",
        "messages": "@model-configs/agentic-generate-content_text.ts",
        "nodeName": "Text",
        "attachments": "@model-configs/agentic-generate-content_text.ts",
        "credentials": "@model-configs/agentic-generate-content_text.ts",
        "generativeModelName": "@model-configs/agentic-generate-content_text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": true
  },
  {
    "id": "LLMNode_255",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/json-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_json_user.md"
          }
        ],
        "memories": "@model-configs/agentic-generate-content_json.ts",
        "messages": "@model-configs/agentic-generate-content_json.ts",
        "nodeName": "JSON",
        "attachments": "@model-configs/agentic-generate-content_json.ts",
        "credentials": "@model-configs/agentic-generate-content_json.ts",
        "generativeModelName": "@model-configs/agentic-generate-content_json.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_904",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_parse-json.ts",
        "nodeName": "Parse JSON"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "ImageGenNode_535",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "ImageGenNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-image-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agentic-generate-content_generate-image_user.md"
          }
        ],
        "nodeName": "Generate Image",
        "imageGenModelName": "@model-configs/agentic-generate-content_generate-image.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "codeNode_136",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agentic-generate-content_finalise-output.ts",
        "nodeName": "Finalise Output"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 600
    },
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
        "outputMapping": "{\n  \"answer\": \"{{codeNode_136.output}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 750
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-conditionNode_374",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "conditionNode_374",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-LLMNode_430-637",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "LLMNode_430",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-LLMNode_255-708",
    "data": {
      "condition": "Condition 3"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "LLMNode_255",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_255-codeNode_904",
    "type": "defaultEdge",
    "source": "LLMNode_255",
    "target": "codeNode_904",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-codeNode_567-576",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "codeNode_567",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_136-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_136",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_430-codeNode_136-837",
    "type": "defaultEdge",
    "source": "LLMNode_430",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_904-codeNode_136-182",
    "type": "defaultEdge",
    "source": "codeNode_904",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_567-codeNode_136-158",
    "type": "defaultEdge",
    "source": "codeNode_567",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "ImageGenNode_535-codeNode_136",
    "type": "defaultEdge",
    "source": "ImageGenNode_535",
    "target": "codeNode_136",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_374-ImageGenNode_535-560",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_374",
    "target": "ImageGenNode_535",
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
