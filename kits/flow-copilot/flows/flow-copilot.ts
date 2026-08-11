// Flow: flow-copilot

// -- Meta --
export const meta = {
  "name": "flow-copilot",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Vikas C S",
    "email": "04vikascs@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "memoryRetrieveNode_859": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "RAGNode_640": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_474": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_429": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "memoryNode_302": [
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
    "flow_copilot_ragnode_640_system_0": "@prompts/flow-copilot_ragnode-640_system_0.md",
    "flow_copilot_ragnode_640_user_1": "@prompts/flow-copilot_ragnode-640_user_1.md",
    "flow_copilot_llmnode_474_system_0": "@prompts/flow-copilot_llmnode-474_system_0.md",
    "flow_copilot_llmnode_474_user_1": "@prompts/flow-copilot_llmnode-474_user_1.md",
    "flow_copilot_instructor_llmnode_429_system_0": "@prompts/flow-copilot_instructor-llmnode-429_system_0.md",
    "flow_copilot_instructor_llmnode_429_user_1": "@prompts/flow-copilot_instructor-llmnode-429_user_1.md"
  },
  "modelConfigs": {
    "flow_copilot_memory_retrieve_node_859_embedding_model_name": "@model-configs/flow-copilot_memory-retrieve-node-859_embedding-model-name.ts",
    "flow_copilot_ragnode_640_generative_model_name": "@model-configs/flow-copilot_ragnode-640_generative-model-name.ts",
    "flow_copilot_ragnode_640_embedding_model_name": "@model-configs/flow-copilot_ragnode-640_embedding-model-name.ts",
    "flow_copilot_llmnode_474_generative_model_name": "@model-configs/flow-copilot_llmnode-474_generative-model-name.ts",
    "flow_copilot_instructor_llmnode_429_generative_model_name": "@model-configs/flow-copilot_instructor-llmnode-429_generative-model-name.ts",
    "flow_copilot_memory_node_302_generative_model_name": "@model-configs/flow-copilot_memory-node-302_generative-model-name.ts",
    "flow_copilot_memory_node_302_embedding_model_name": "@model-configs/flow-copilot_memory-node-302_embedding-model-name.ts"
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
      "nodeId": "chatTriggerNode",
      "trigger": true,
      "values": {
        "chat": "",
        "domains": [
          "*"
        ],
        "nodeName": "Chat Widget",
        "chatConfig": {
          "botName": "Lamatic Bot",
          "imageUrl": "https://img.freepik.com/premium-vector/robot-android-super-hero_111928-7.jpg?w=826",
          "position": "right",
          "policyUrl": "https://lamatic.ai/docs/legal/privacy-policy",
          "displayMode": "popup",
          "placeholder": "Compose your message",
          "suggestions": [
            "What is lamatic?",
            "How do I add data to my chatbot?",
            "Explain this product to me"
          ],
          "errorMessage": "Oops! Something went wrong. Please try again.",
          "hideBranding": false,
          "primaryColor": "#ef4444",
          "headerBgColor": "#000000",
          "greetingMessage": "Hi, I am Lamatic Bot. Ask me anything about Lamatic",
          "headerTextColor": "#FFFFFF",
          "showEmojiButton": true,
          "suggestionBgColor": "#f1f5f9",
          "userMessageBgColor": "#FEF2F2",
          "agentMessageBgColor": "#f1f5f9",
          "suggestionTextColor": "#334155",
          "userMessageTextColor": "#d12323",
          "agentMessageTextColor": "#334155"
        }
      }
    }
  },
  {
    "id": "memoryRetrieveNode_859",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "id": "memoryRetrieveNode_859",
        "limit": "3",
        "filters": "[]",
        "nodeName": "Memory Retrieve",
        "searchQuery": "{{triggerNode_1.output.chatMessage}}",
        "memoryCollection": "flowcopilotconversationmemory",
        "embeddingModelName": "@model-configs/flow-copilot_memory-retrieve-node-859_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "RAGNode_640",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "limit": "3",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/flow-copilot_ragnode-640_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/flow-copilot_ragnode-640_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "RAG",
        "vectorDB": [
          "lamaticnodedocs"
        ],
        "certainty": "0.7",
        "queryField": "{{triggerNode_1.output.chatMessage}}",
        "embeddingModelName": "@model-configs/flow-copilot_ragnode-640_embedding-model-name.ts",
        "generativeModelName": "@model-configs/flow-copilot_ragnode-640_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_474",
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
            "content": "@prompts/flow-copilot_llmnode-474_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/flow-copilot_llmnode-474_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/flow-copilot_llmnode-474_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_429",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"flowName\": {\n      \"type\": \"string\",\n      \"required\": true\n    },\n    \"trigger\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"type\": {\n          \"type\": \"string\",\n          \"required\": true\n        },\n        \"config\": {\n          \"type\": \"string\",\n          \"required\": true\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"nodes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"type\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"purpose\": {\n            \"type\": \"string\",\n            \"required\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"nodeSequence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      }\n    },\n    \"assumptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\",\n        \"required\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/flow-copilot_instructor-llmnode-429_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/flow-copilot_instructor-llmnode-429_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/flow-copilot_instructor-llmnode-429_generative-model-name.ts"
      }
    }
  },
  {
    "id": "memoryNode_302",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryNode",
      "values": {
        "id": "memoryNode_302",
        "nodeName": "Memory Add",
        "uniqueId": "{{triggerNode_1.output.sessionId}}",
        "sessionId": "{{triggerNode_1.output.sessionId}}",
        "memoryValue": [
          {
            "role": "user",
            "content": "User asked: {{triggerNode_1.output.chatMessage}} — Assistant responded: {{InstructorLLMNode_429.output.flowName}} | Trigger: {{InstructorLLMNode_429.output.trigger}} | Nodes: {{InstructorLLMNode_429.output.nodes}} | Sequence: {{InstructorLLMNode_429.output.nodeSequence}} | Assumptions: {{InstructorLLMNode_429.output.assumptions}}"
          }
        ],
        "memoryCollection": "flowcopilotconversationmemory",
        "embeddingModelName": "@model-configs/flow-copilot_memory-node-302_embedding-model-name.ts",
        "generativeModelName": "@model-configs/flow-copilot_memory-node-302_generative-model-name.ts"
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
      "nodeId": "chatResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "content": "Here's your flow blueprint: {{InstructorLLMNode_429.output.flowName}}— Sequence: {{InstructorLLMNode_429.output.nodeSequence}}— Assumptions: {{InstructorLLMNode_429.output.assumptions}}— Trigger: {{InstructorLLMNode_429.output.trigger}}— Nodes: {{InstructorLLMNode_429.output.nodes}}",
        "nodeName": "Chat Response",
        "references": "",
        "webhookUrl": "",
        "webhookHeaders": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "RAGNode_640-LLMNode_474",
    "source": "RAGNode_640",
    "target": "LLMNode_474",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-memoryRetrieveNode_859",
    "source": "triggerNode_1",
    "target": "memoryRetrieveNode_859",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_859-RAGNode_640",
    "source": "memoryRetrieveNode_859",
    "target": "RAGNode_640",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_474-InstructorLLMNode_429",
    "source": "LLMNode_474",
    "target": "InstructorLLMNode_429",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_429-memoryNode_302",
    "source": "InstructorLLMNode_429",
    "target": "memoryNode_302",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryNode_302-responseNode_triggerNode_1-567",
    "source": "memoryNode_302",
    "target": "responseNode_triggerNode_1",
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
