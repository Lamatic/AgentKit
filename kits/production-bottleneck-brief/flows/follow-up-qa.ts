// Flow: follow-up-qa

// -- Meta --
export const meta = {
  "name": "Follow-up QA",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ibrahim Khan",
    "email": "gr25816@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "memoryRetrieveNode_644": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "LLMNode_222": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "memoryNode_268": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "follow_up_qa_llmnode_222_system_0": "@prompts/follow-up-qa_llmnode-222_system_0.md",
    "follow_up_qa_llmnode_222_user_1": "@prompts/follow-up-qa_llmnode-222_user_1.md"
  },
  "modelConfigs": {
    "follow_up_qa_memory_retrieve_node_644_embedding_model_name": "@model-configs/follow-up-qa_memory-retrieve-node-644_embedding-model-name.ts",
    "follow_up_qa_llmnode_222_generative_model_name": "@model-configs/follow-up-qa_llmnode-222_generative-model-name.ts",
    "follow_up_qa_memory_node_268_generative_model_name": "@model-configs/follow-up-qa_memory-node-268_generative-model-name.ts",
    "follow_up_qa_memory_node_268_embedding_model_name": "@model-configs/follow-up-qa_memory-node-268_embedding-model-name.ts"
  },
  "scripts": {
    "follow_up_qa_code_node_797_code": "@scripts/follow-up-qa_code-node-797_code.ts"
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
        "advance_schema": "{\n  \"orders\": [\n    {\n      \"id\": \"string\",\n      \"dueDate\": \"string\",\n      \"stages\": \"[string]\",\n      \"currentStage\": \"string\",\n      \"stageEnteredDate\": \"string\",\n      \"quantity\": \"string\",\n      \"completedQuantity\": \"string\"\n    }\n  ],\n  \"orderId\": \"string\",\n  \"question\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_797",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/follow-up-qa_code-node-797_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "memoryRetrieveNode_644",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "id": "memoryRetrieveNode_644",
        "limit": 5,
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"uniqueId\"\n      ],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.orderId}}\"\n    }\n  ]\n}",
        "nodeName": "Memory Retrieve",
        "searchQuery": "{{triggerNode_1.output.question}}",
        "memoryCollection": "orderQaHistory",
        "embeddingModelName": "@model-configs/follow-up-qa_memory-retrieve-node-644_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_222",
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
            "content": "@prompts/follow-up-qa_llmnode-222_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/follow-up-qa_llmnode-222_user_1.md"
          }
        ],
        "memories": "{{memoryRetrieveNode_644.output.memories}}",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/follow-up-qa_llmnode-222_generative-model-name.ts"
      }
    }
  },
  {
    "id": "memoryNode_268",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "id": "memoryNode_268",
        "metadata": "{\"orderId\": \"{{triggerNode_1.output.orderId}}\"}",
        "nodeName": "Memory Add",
        "uniqueId": "{{triggerNode_1.output.orderId}}",
        "sessionId": "",
        "memoryValue": [
          {
            "role": "user",
            "content": "Role: user, Content: {{triggerNode_1.output.question}}"
          },
          {
            "role": "user",
            "content": "Role: assistant, Content: {{LLMNode_222.output.generatedResponse}}"
          }
        ],
        "memoryCollection": "orderQaHistory",
        "embeddingModelName": "@model-configs/follow-up-qa_memory-node-268_embedding-model-name.ts",
        "generativeModelName": "@model-configs/follow-up-qa_memory-node-268_generative-model-name.ts"
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
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_222.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_797",
    "source": "triggerNode_1",
    "target": "codeNode_797",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_222-memoryNode_268",
    "source": "LLMNode_222",
    "target": "memoryNode_268",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_268-responseNode_triggerNode_1",
    "source": "memoryNode_268",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_797-memoryRetrieveNode_644-918",
    "source": "codeNode_797",
    "target": "memoryRetrieveNode_644",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_644-LLMNode_222-481",
    "source": "memoryRetrieveNode_644",
    "target": "LLMNode_222",
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
