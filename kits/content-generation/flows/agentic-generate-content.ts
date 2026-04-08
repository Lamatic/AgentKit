// Flow: agentic-generate-content
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

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
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "text_system": "@prompts/text-system.md",
    "json_system": "@prompts/json-system.md",
    "generate_image_system": "@prompts/generate-image-system.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
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
        "advance_schema": "{\n  \"mode\": \"string\",\n  \"instructions\": \"string\"\n}"
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
        "code": "output = \"Invalid Mode of Request\";",
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
            "content": "USER INSTRUCTION : {{triggerNode_1.output.instructions}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": ""
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
            "content": "GENERATE A JSON FOR THIS USER REQUEST : {{triggerNode_1.output.instructions}}"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "JSON",
        "attachments": "",
        "credentials": "",
        "generativeModelName": ""
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
        "code": "let answer = {};\nanswer = JSON.parse({{LLMNode_255.output.generatedResponse}});\noutput = answer;",
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
            "content": "CREATE AN IMAGE FOR THIS INSTRUCTION : {{triggerNode_1.output.instructions}}"
          }
        ],
        "nodeName": "Generate Image",
        "imageGenModelName": ""
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
        "code": "let answer = \"\";\n\nif({{LLMNode_430.output.generatedResponse}}){\n  answer = {{LLMNode_430.output.generatedResponse}};\n}\nelse if({{ImageGenNode_535.output.imageUrl}}){\n  answer = {{ImageGenNode_535.output.imageUrl}};\n}\nelse if({{LLMNode_255.output.generatedResponse}}){\n  answer = {{codeNode_904.output}};\n}\n\noutput = answer;",
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
