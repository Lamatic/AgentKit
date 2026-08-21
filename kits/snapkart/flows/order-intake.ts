// Flow: order-intake

// -- Meta --
export const meta = {
  "name": "order-intake",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Harshit Gupta",
    "email": "harshit.105418@stu.upes.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "memoryRetrieveNode_124": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "agentClassifierNode_424": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_102": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "slackNode_924": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select"
    },
    {
      "name": "channelName",
      "label": "Channel",
      "type": "resourceLocator"
    }
  ],
  "LLMNode_380": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "twilioNode_928": [
    {
      "name": "credentials",
      "label": "Credentials",
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
    "order_intake_agent_classifier_node_424_system_0": "@prompts/order-intake_agent-classifier-node-424_system_0.md",
    "order_intake_agent_classifier_node_424_user_1": "@prompts/order-intake_agent-classifier-node-424_user_1.md",
    "order_intake_instructor_llmnode_102_system_0": "@prompts/order-intake_instructor-llmnode-102_system_0.md",
    "order_intake_instructor_llmnode_102_user_1": "@prompts/order-intake_instructor-llmnode-102_user_1.md",
    "order_intake_llmnode_380_system_0": "@prompts/order-intake_llmnode-380_system_0.md",
    "order_intake_llmnode_380_user_1": "@prompts/order-intake_llmnode-380_user_1.md"
  },
  "modelConfigs": {
    "order_intake_memory_retrieve_node_124_embedding_model_name": "@model-configs/order-intake_memory-retrieve-node-124_embedding-model-name.ts",
    "order_intake_agent_classifier_node_424_generative_model_name": "@model-configs/order-intake_agent-classifier-node-424_generative-model-name.ts",
    "order_intake_hybrid_search_node_745_embedding_model_name": "@model-configs/order-intake_hybrid-search-node-745_embedding-model-name.ts",
    "order_intake_instructor_llmnode_102_generative_model_name": "@model-configs/order-intake_instructor-llmnode-102_generative-model-name.ts",
    "order_intake_llmnode_380_generative_model_name": "@model-configs/order-intake_llmnode-380_generative-model-name.ts"
  },
  "scripts": {
    "order_intake_code_node_390_code": "@scripts/order-intake_code-node-390_code.ts"
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
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "memoryRetrieveNode_124",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "memoryRetrieveNode",
      "values": {
        "id": "memoryRetrieveNode_124",
        "limit": 1,
        "filters": "[]",
        "nodeName": "Memory Retrieve",
        "searchQuery": "{{triggerNode_1.output.Body}}",
        "memoryCollection": "kiranacustomers",
        "embeddingModelName": "@model-configs/order-intake_memory-retrieve-node-124_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "agentClassifierNode_424",
    "type": "agentClassifierNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "agentClassifierNode",
      "values": {
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/order-intake_agent-classifier-node-424_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/order-intake_agent-classifier-node-424_user_1.md"
          }
        ],
        "nodeName": "Classifier",
        "classifier": [
          {
            "label": "new_order",
            "value": "agentClassifierNode_424-addNode_961",
            "description": "Customer wants to buy/order items. Contains product names, quantities, or delivery requests. E.g. \"2 surf excel bhej do\", \"1 kg chini chahiye"
          },
          {
            "label": "chitchat",
            "value": "agentClassifierNode_424-plus-node-addNode_741493-284",
            "description": "Greetings and small talk with no commercial content. E.g. \"hi\", \"kese ho ap"
          },
          {
            "label": "complaint",
            "value": "agentClassifierNode_424-plus-node-addNode_565725-105",
            "description": "Customer reports a problem with a past order or product. E.g. \"kal wala doodh kharab tha\", \"order nahi aaya"
          },
          {
            "label": "inquiry",
            "value": "agentClassifierNode_424-addNode_988",
            "description": "Customer asks about availability, price, or shop timing without ordering. E.g. \"aata hai kya?\", \"kitne ka hai?\", \"dukan khuli hai?"
          }
        ],
        "generativeModelName": "@model-configs/order-intake_agent-classifier-node-424_generative-model-name.ts"
      }
    }
  },
  {
    "id": "plus-node-addNode_741493",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "plus-node-addNode_202967",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "hybridSearchNode_745",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "hybridSearchNode",
      "values": {
        "id": "hybridSearchNode_745",
        "alpha": "0.25",
        "limit": "3",
        "autocut": "0",
        "filters": "[]",
        "nodeName": "Hybrid Search",
        "vectorDB": "kiranacatalogv3",
        "certainty": "0.25",
        "fusionType": "relativeScoreFusion",
        "searchQuery": "{{triggerNode_1.output.Body}}",
        "boostProperties": false,
        "embeddingModelName": "@model-configs/order-intake_hybrid-search-node-745_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_102",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"items\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"quantity\": {\n            \"type\": \"number\"\n          },\n          \"unit\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"language\": {\n      \"type\": \"string\"\n    },\n    \"clarification_needed\": {\n      \"type\": \"boolean\"\n    },\n    \"clarification_question\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/order-intake_instructor-llmnode-102_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/order-intake_instructor-llmnode-102_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/order-intake_instructor-llmnode-102_generative-model-name.ts"
      }
    }
  },
  {
    "id": "conditionNode_211",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Else",
            "value": "conditionNode_211-addNode_539",
            "condition": {}
          },
          {
            "label": "Condition 1",
            "value": "conditionNode_211-plus-node-addNode_747866-303",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_102.output.clarification_needed}}\",\n      \"operator\": \"==\",\n      \"value\": \"false\"\n    }\n  ]\n}"
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_390",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/order-intake_code-node-390_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "apiNode_966",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_966",
        "url": "https://api.airtable.com/v0/appHpEgHt9JHZoel1/Orders",
        "body": "{\"fields\": {\"phone\": \"+{{triggerNode_1.output.WaId}}\", \"items\": \"{{codeNode_390.output.items_text}}\", \"total\": 0, \"status\": \"pending\"}}",
        "method": "POST",
        "headers": "{\"Authorization\":\"Bearer YOUR_AIRTABLE_TOKEN_HERE\",\"Content-Type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "slackNode_924",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "slackNode",
      "modes": {
        "channelName": "list"
      },
      "values": {
        "id": "slackNode_924",
        "text": "🛒 New order — {{triggerNode_1.output.ProfileName}} (+{{triggerNode_1.output.WaId}})\nItems: {{codeNode_390.output.items_text}}\nStatus: pending",
        "action": "postMessage",
        "nodeName": "Slack",
        "channelName": "C0BGN8MK5P0",
        "credentials": "slack-kirana"
      }
    }
  },
  {
    "id": "addNode_539",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "LLMNode_380",
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
            "content": "@prompts/order-intake_llmnode-380_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/order-intake_llmnode-380_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/order-intake_llmnode-380_generative-model-name.ts"
      }
    }
  },
  {
    "id": "twilioNode_928",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "twilioNode",
      "values": {
        "id": "twilioNode_928",
        "to": "{{triggerNode_1.output.From}}",
        "body": "{{LLMNode_380.output.generatedResponse}}",
        "from": "whatsapp:+14155238886",
        "action": "whatsapp",
        "timeout": 60,
        "nodeName": "Twilio",
        "whatsappTo": "{{triggerNode_1.output.From}}",
        "credentials": "twilio-kirana",
        "whatsappFrom": "whatsapp:+14155238886",
        "whatsappMessage": "{{LLMNode_380.output.generatedResponse}}"
      }
    }
  },
  {
    "id": "plus-node-addNode_149290",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "agentClassifierNode_424-plus-node-addNode_741493",
    "source": "agentClassifierNode_424",
    "target": "plus-node-addNode_741493",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_424-plus-node-addNode_202967",
    "source": "agentClassifierNode_424",
    "target": "plus-node-addNode_202967",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "agentClassifierNode_424-InstructorLLMNode_102",
    "source": "agentClassifierNode_424",
    "target": "InstructorLLMNode_102",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "plus-node-addNode_741493-LLMNode_380",
    "source": "plus-node-addNode_741493",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "plus-node-addNode_202967-LLMNode_380",
    "source": "plus-node-addNode_202967",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_380-twilioNode_928",
    "source": "LLMNode_380",
    "target": "twilioNode_928",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_102-conditionNode_211",
    "source": "InstructorLLMNode_102",
    "target": "conditionNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_211-addNode_539",
    "source": "conditionNode_211",
    "target": "addNode_539",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_211-codeNode_390-657",
    "source": "conditionNode_211",
    "target": "codeNode_390",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_390-apiNode_966",
    "source": "codeNode_390",
    "target": "apiNode_966",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_539-LLMNode_380-395",
    "source": "addNode_539",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_966-slackNode_924",
    "source": "apiNode_966",
    "target": "slackNode_924",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "twilioNode_928-plus-node-addNode_149290-841",
    "source": "twilioNode_928",
    "target": "plus-node-addNode_149290",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "agentClassifierNode_424-hybridSearchNode_745-705",
    "source": "agentClassifierNode_424",
    "target": "hybridSearchNode_745",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "agentClassifierEdge"
  },
  {
    "id": "hybridSearchNode_745-LLMNode_380-233",
    "source": "hybridSearchNode_745",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-memoryRetrieveNode_124",
    "source": "triggerNode_1",
    "target": "memoryRetrieveNode_124",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "memoryRetrieveNode_124-agentClassifierNode_424",
    "source": "memoryRetrieveNode_124",
    "target": "agentClassifierNode_424",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "slackNode_924-LLMNode_380-563",
    "source": "slackNode_924",
    "target": "LLMNode_380",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
