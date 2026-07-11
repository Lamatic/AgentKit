// Flow: devdiary-log

// -- Meta --
export const meta = {
  "name": "devdiary-log",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Chirag",
    "email": "chiragbaldia@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_719": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "vectorizeNode_621": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_793": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "devdiary_log_llmnode_719_system_0": "@prompts/devdiary-log_llmnode-719_system_0.md",
    "devdiary_log_llmnode_719_user_1": "@prompts/devdiary-log_llmnode-719_user_1.md"
  },
  "modelConfigs": {
    "devdiary_log_llmnode_719_generative_model_name": "@model-configs/devdiary-log_llmnode-719_generative-model-name.ts",
    "devdiary_log_vectorize_node_621_embedding_model_name": "@model-configs/devdiary-log_vectorize-node-621_embedding-model-name.ts"
  },
  "scripts": {
    "devdiary_log_code_node_999_code": "@scripts/devdiary-log_code-node-999_code.ts"
  }
};

// -- Nodes & Edges --
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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"project\": \"string\",\n  \"repo\": \"string\",\n  \"branch\": \"string\",\n  \"author\": \"string\",\n  \"date\": \"string\",\n  \"commitText\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_719",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/devdiary-log_llmnode-719_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/devdiary-log_llmnode-719_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/devdiary-log_llmnode-719_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_999",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/devdiary-log_code-node-999_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_621",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_999.output.entryTexts}}",
        "embeddingModelName": "@model-configs/devdiary-log_vectorize-node-621_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_793",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_793",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "devdiary",
        "primaryKeys": [
          "project",
          "date"
        ],
        "vectorsField": "{{vectorizeNode_621.output.vectors}}",
        "metadataField": "{{codeNode_999.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\"entry\": \"{{LLMNode_719.output.generatedResponse}}\", \"project\": \"{{triggerNode_1.output.project}}\", \"date\": \"{{triggerNode_1.output.date}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_719",
    "source": "triggerNode_1",
    "target": "LLMNode_719",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_621-vectorNode_793",
    "source": "vectorizeNode_621",
    "target": "vectorNode_793",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_793-responseNode_triggerNode_1",
    "source": "vectorNode_793",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_719-codeNode_999",
    "source": "LLMNode_719",
    "target": "codeNode_999",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_999-vectorizeNode_621",
    "source": "codeNode_999",
    "target": "vectorizeNode_621",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
