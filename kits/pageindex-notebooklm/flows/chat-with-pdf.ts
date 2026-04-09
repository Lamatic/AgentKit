// Flow: chat-with-pdf

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Chat with Pdf",
  "description": "chat-with-pdf using NotebookLM",
  "tags": [
    "pdf",
    "notebooklm",
    "assistant",
    "document-search"
  ],
  "testInput": "{}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "postgresNode_817": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for postgres authentication.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "InstructorLLMNode_432": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
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
      }
    }
  ],
  "LLMNode_392": [
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
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "chat_with_pdf_generate_json_system": "@prompts/chat-with-pdf_generate-json_system.md",
    "chat_with_pdf_generate_json_user": "@prompts/chat-with-pdf_generate-json_user.md",
    "chat_with_pdf_generate_text_system": "@prompts/chat-with-pdf_generate-text_system.md",
    "chat_with_pdf_generate_text_user": "@prompts/chat-with-pdf_generate-text_user.md"
  },
  "scripts": {
    "chat_with_pdf_code": "@scripts/chat-with-pdf_code.ts"
  },
  "modelConfigs": {
    "chat_with_pdf_generate_json": "@model-configs/chat-with-pdf_generate-json.ts",
    "chat_with_pdf_generate_text": "@model-configs/chat-with-pdf_generate-text.ts"
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
        "advance_schema": "{\n  \"doc_id\": \"string\",\n  \"query\": \"string\",\n  \"messages\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "postgresNode_817",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_817",
        "query": "SELECT tree, raw_text, file_name FROM documents WHERE doc_id = '{{triggerNode_1.output.doc_id}}' LIMIT 1;",
        "action": "runQuery",
        "nodeName": "Postgres",
        "credentials": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "codeNode_429",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "toc_json": "string",
        "node_count": "number"
      },
      "values": {
        "id": "codeNode_429",
        "code": "@scripts/chat-with-pdf_code.ts",
        "nodeName": "Code"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_432",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_432",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"thinking\": {\n      \"type\": \"string\"\n    },\n    \"node_list\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/chat-with-pdf_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chat-with-pdf_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/chat-with-pdf_generate-json.ts",
        "messages": "@model-configs/chat-with-pdf_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/chat-with-pdf_generate-json.ts",
        "generativeModelName": "@model-configs/chat-with-pdf_generate-json.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "codeNode_358",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "context": "string",
        "total_chars": "number",
        "retrieved_nodes": "array"
      },
      "values": {
        "id": "codeNode_358",
        "code": "@scripts/chat-with-pdf_code.ts",
        "nodeName": "Code"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": true
  },
  {
    "id": "LLMNode_392",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_392",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/chat-with-pdf_generate-text_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/chat-with-pdf_generate-text_user.md"
          }
        ],
        "memories": "@model-configs/chat-with-pdf_generate-text.ts",
        "messages": "@model-configs/chat-with-pdf_generate-text.ts",
        "nodeName": "Generate Text",
        "attachments": "@model-configs/chat-with-pdf_generate-text.ts",
        "credentials": "@model-configs/chat-with-pdf_generate-text.ts",
        "generativeModelName": "@model-configs/chat-with-pdf_generate-text.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"answer\": \"{{LLMNode_392.output.generatedResponse}}\",\n  \"messages\": \"{{LLMNode_392.output.messages}}\",\n  \"retrieved_nodes\": \"{{codeNode_358.output.retrieved_nodes}}\",\n  \"thinking\": \"{{InstructorLLMNode_432.output.thinking}}\",\n  \"doc_id\": \"{{triggerNode_1.output.doc_id}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-postgresNode_817",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "postgresNode_817",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_432-codeNode_358",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_432",
    "target": "codeNode_358",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "postgresNode_817-codeNode_429",
    "type": "defaultEdge",
    "source": "postgresNode_817",
    "target": "codeNode_429",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_429-InstructorLLMNode_432",
    "type": "defaultEdge",
    "source": "codeNode_429",
    "target": "InstructorLLMNode_432",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_358-LLMNode_392",
    "type": "defaultEdge",
    "source": "codeNode_358",
    "target": "LLMNode_392",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_392-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "LLMNode_392",
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
