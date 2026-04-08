// Flow: embedded-sheets

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1. Embedded AI Sheets",
  "description": "",
  "tags": [],
  "testInput": {
    "sheetId": "d0062c86b2494d83",
    "columnId": "8c5e89f9b7c74f27",
    "rowId": "2e94ccdfa59540c2",
    "instruction": "summarise in funny tone based on context",
    "aiType": "summarize",
    "data": "words: 50; blog: ### Lamatic AI vs. Vellum: Choosing the Right Tool for Your Words  In the evolving landscape of digital writing and publishing, two platforms stand out for their innovative approaches: Lamatic AI and Vellum. Both offer powerful solutions for writers, but they cater to distinctly different stages of the creative process. Lamatic AI excels in content generation and writing assistance, while Vellum is the gold standard for professional book formatting. Understanding their unique strengths is key to choosing the right tool for your specific project.  Lamatic AI is a creator's powerhouse, designed to streamline the writing process from idea to first draft. Its core strength lies in its advanced AI, which can generate articles, brainstorm ideas, and help overcome writer's block. For bloggers, marketers, and content creators, Lamatic AI is an invaluable partner. The user-friendly interface makes it simple to produce dynamic, SEO-friendly content quickly. It acts as an intelligent assistant, focusing on the \"what\" and \"how\" of your writing, ensuring your message is crafted effectively.  On the other hand, Vellum is the artisan's tool for the final presentation. It specializes in one thing and does it flawlessly: creating beautifully formatted books. Primarily for authors preparing to publish, Vellum offers a suite of elegant templates that produce professional-grade ebooks and print-ready PDFs with minimal effort. Its focus is purely on aesthetics and formatting, transforming a finished manuscript into a polished product ready for platforms like Amazon KDP or Apple Books. It handles everything from chapter headings to drop caps with grace.  So, which should you choose? The decision comes down to your primary need. If you're focused on content creation, generating drafts, and need AI-powered writing assistance, Lamatic AI is your ideal companion. If you have a completed manuscript and your goal is to produce a visually stunning, professionally formatted book for publication, Vellum is the undisputed choice.  Have you used either of these platforms? Share your experiences and which tool best fits your workflow in the comments below",
    "outputFormat": "text",
    "webhookUrl": "https://v0-agent-kit-sheets.vercel.app/api/webhook/ai-result"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_608": [
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
  "LLMNode_533": [
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
  "LLMNode_432": [
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
  "LLMNode_658": [
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
  "LLMNode_588": [
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
  "LLMNode_447": [
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
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "generate_image_prompt_system": "@prompts/generate-image-prompt-system.md",
    "generate_image_system": "@prompts/generate-image-system.md",
    "generate_text_prompt_system": "@prompts/generate-text-prompt-system.md",
    "generate_text_system": "@prompts/generate-text-system.md",
    "summarisation_system": "@prompts/summarisation-system.md",
    "categorise_system": "@prompts/categorise-system.md"
  },
  "modelConfigs": {
    "embedded_sheets_generate_image_prompt": "@model-configs/embedded-sheets_generate-image-prompt.ts",
    "embedded_sheets_generate_image": "@model-configs/embedded-sheets_generate-image.ts",
    "embedded_sheets_generate_text_prompt": "@model-configs/embedded-sheets_generate-text-prompt.ts",
    "embedded_sheets_generate_text": "@model-configs/embedded-sheets_generate-text.ts",
    "embedded_sheets_summarisation": "@model-configs/embedded-sheets_summarisation.ts",
    "embedded_sheets_categorise": "@model-configs/embedded-sheets_categorise.ts"
  },
  "triggers": {
    "embedded_sheets_api_request": "@triggers/webhooks/embedded-sheets_api-request.ts"
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
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/embedded-sheets_api-request.ts",
        "advance_schema": "@triggers/webhooks/embedded-sheets_api-request.ts"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "conditionNode_312",
    "data": {
      "label": "Condition",
      "modes": [],
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_312-addNode_954",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"generate\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_312-addNode_946",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_312-plus-node-addNode_608892-521",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"summarize\"\n    }\n  ]\n}"
          },
          {
            "label": "Condition 3",
            "value": "conditionNode_312-plus-node-addNode_163347-394",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.aiType}}\",\n      \"operator\": \"==\",\n      \"value\": \"categorize\"\n    }\n  ]\n}"
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
      "x": 1575,
      "y": 150
    },
    "selected": false
  },
  {
    "id": "conditionNode_799",
    "data": {
      "label": "Condition",
      "modes": {},
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_799-addNode_587",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.outputFormat}}\",\n      \"operator\": \"==\",\n      \"value\": \"text\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_799-addNode_161",
            "condition": {}
          },
          {
            "label": "Condition 2",
            "value": "conditionNode_799-plus-node-addNode_834736-660",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.outputFormat}}\",\n      \"operator\": \"==\",\n      \"value\": \"image\"\n    }\n  ]\n}"
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
      "x": 450,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "plus-node-addNode_782449",
    "data": {
      "label": "+",
      "nodeId": "addNode",
      "values": {}
    },
    "type": "addNode",
    "measured": {
      "width": 218,
      "height": 100
    },
    "position": {
      "x": 900,
      "y": 600
    }
  },
  {
    "id": "LLMNode_608",
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
            "content": "@prompts/generate-image-prompt-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "USER REQUEST : {{triggerNode_1.output.instruction}}\n\nCONTEXT : {{triggerNode_1.output.data}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "messages": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "nodeName": "Generate Image Prompt",
        "attachments": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "credentials": "@model-configs/embedded-sheets_generate-image-prompt.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-image-prompt.ts"
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
    "id": "LLMNode_533",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-image-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "GIVE ME AN IMAGE OF THIS REQUEST : {{LLMNode_608.output.generatedResponse}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-image.ts",
        "messages": "@model-configs/embedded-sheets_generate-image.ts",
        "nodeName": "Generate Image",
        "attachments": "@model-configs/embedded-sheets_generate-image.ts",
        "credentials": "@model-configs/embedded-sheets_generate-image.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-image.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "LLMNode_432",
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
            "content": "@prompts/generate-text-prompt-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "USER REQUEST : {{triggerNode_1.output.instruction}}\n\nCONTEXTS : {{triggerNode_1.output.data}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "messages": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "nodeName": "Generate Text Prompt",
        "attachments": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "credentials": "@model-configs/embedded-sheets_generate-text-prompt.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-text-prompt.ts"
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
    "selected": false
  },
  {
    "id": "LLMNode_658",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
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
            "content": "USER REQUEST : {{LLMNode_432.output.generatedResponse}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_generate-text.ts",
        "messages": "@model-configs/embedded-sheets_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/embedded-sheets_generate-text.ts",
        "credentials": "@model-configs/embedded-sheets_generate-text.ts",
        "generativeModelName": "@model-configs/embedded-sheets_generate-text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_750",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "let response = \"\";\n\nif({{LLMNode_658.output}} && {{LLMNode_658.output.generatedResponse}}){\n  response = {{LLMNode_658.output.generatedResponse}};\n} else if({{LLMNode_533.output}} && {{LLMNode_533.output.images}}){\n  const images = {{LLMNode_533.output.images}};\n  response = images[0];\n}\n\noutput = response || \"No output generated\";",
        "nodeName": "Finalise Generation Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "codeNode_494",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "output = \"Invalid Request\"",
        "nodeName": "Invalid Request"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 2250,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "LLMNode_588",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/summarisation-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "SUMMARISE BASED ON THE USER REQUEST : {{triggerNode_1.output.instruction}}\n\nAND CONTEXT PARAMS : {{triggerNode_1.output.data}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_summarisation.ts",
        "messages": "@model-configs/embedded-sheets_summarisation.ts",
        "nodeName": "Summarisation",
        "attachments": "@model-configs/embedded-sheets_summarisation.ts",
        "credentials": "@model-configs/embedded-sheets_summarisation.ts",
        "generativeModelName": "@model-configs/embedded-sheets_summarisation.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_302",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "output = {{LLMNode_588.output.generatedResponse}};",
        "nodeName": "Finalise Summary Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "LLMNode_447",
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
            "content": "@prompts/categorise-system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "USER REQUEST : {{triggerNode_1.output.instruction}}\n\nCATEGORISE THE INFORMATION : {{triggerNode_1.output.data}}"
          }
        ],
        "memories": "@model-configs/embedded-sheets_categorise.ts",
        "messages": "@model-configs/embedded-sheets_categorise.ts",
        "nodeName": "Categorise",
        "attachments": "@model-configs/embedded-sheets_categorise.ts",
        "credentials": "@model-configs/embedded-sheets_categorise.ts",
        "generativeModelName": "@model-configs/embedded-sheets_categorise.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1800,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_319",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "output = {{LLMNode_447.output.generatedResponse}};",
        "nodeName": "Finalise Categorisation Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1800,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "codeNode_473",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "let response = \"\";\n\nif({{LLMNode_658.output.generatedResponse}} || {{LLMNode_533.output.images}}){\n  response = {{codeNode_750.output}};\n}\nelse if({{LLMNode_588.output.generatedResponse}}){\n  response = {{codeNode_302.output}};\n}\nelse if({{LLMNode_447.output.generatedResponse}}){\n  response = {{codeNode_319.output}};\n}\nelse{\n  response = {{codeNode_494.output}};\n}\n\noutput = response;",
        "nodeName": "Finalise Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "apiNode_280",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "{{triggerNode_1.output.webhookUrl}}",
        "body": "{\n  \"value\": \"{{codeNode_473.output}}\",\n  \"metadata\": {\n    \"sheetId\": \"{{triggerNode_1.output.sheetId}}\",\n    \"columnId\": \"{{triggerNode_1.output.columnId}}\",\n    \"rowId\": \"{{triggerNode_1.output.rowId}}\"\n  }\n}",
        "method": "POST",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Update Cell",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 1050
    },
    "selected": true
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"value\": \"{{codeNode_473.output}}\",\n  \"metadata\": {\n    \"sheetId\": \"{{triggerNode_1.output.sheetId}}\",\n    \"columnId\": \"{{triggerNode_1.output.columnId}}\",\n    \"rowId\": \"{{triggerNode_1.output.rowId}}\"\n  }\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1575,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-conditionNode_312",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "conditionNode_312",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-conditionNode_799-590",
    "data": {
      "condition": "Condition 1",
      "branchName": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "conditionNode_799",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-LLMNode_432-363",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "LLMNode_432",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_432-LLMNode_658",
    "type": "defaultEdge",
    "source": "LLMNode_432",
    "target": "LLMNode_658",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-LLMNode_608-318",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "LLMNode_608",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_658-codeNode_750-308",
    "type": "defaultEdge",
    "source": "LLMNode_658",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_608-LLMNode_533",
    "type": "defaultEdge",
    "source": "LLMNode_608",
    "target": "LLMNode_533",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_533-codeNode_750",
    "type": "defaultEdge",
    "source": "LLMNode_533",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-LLMNode_447-248",
    "data": {
      "condition": "Condition 3"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "LLMNode_447",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_750-codeNode_473-689",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_750",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_588-codeNode_302",
    "type": "defaultEdge",
    "source": "LLMNode_588",
    "target": "codeNode_302",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_302-codeNode_473",
    "type": "defaultEdge",
    "source": "codeNode_302",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_447-codeNode_319",
    "type": "defaultEdge",
    "source": "LLMNode_447",
    "target": "codeNode_319",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_319-codeNode_473",
    "type": "defaultEdge",
    "source": "codeNode_319",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-codeNode_494-475",
    "data": {
      "condition": "Else",
      "branchName": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "codeNode_494",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_494-codeNode_473-482",
    "type": "defaultEdge",
    "source": "codeNode_494",
    "target": "codeNode_473",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_799-plus-node-addNode_782449-161",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_799",
    "target": "plus-node-addNode_782449",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "plus-node-addNode_782449-codeNode_750-286",
    "type": "defaultEdge",
    "source": "plus-node-addNode_782449",
    "target": "codeNode_750",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_312-LLMNode_588-227",
    "data": {
      "condition": "Condition 2"
    },
    "type": "conditionEdge",
    "source": "conditionNode_312",
    "target": "LLMNode_588",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_473-apiNode_280",
    "type": "defaultEdge",
    "source": "codeNode_473",
    "target": "apiNode_280",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_280-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "apiNode_280",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
