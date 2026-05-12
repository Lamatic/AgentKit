// Flow: excuse-generator

// -- Meta --
export const meta = {
  "name": "Excuse-Generator",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Tilak Raj",
    "email": "kumartiktok123@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_excuseEngine": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
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
    "excuse_generator_instructor_llmnode_excuse_engine_system_0": "@prompts/excuse-generator_instructor-llmnode-excuse-engine_system_0.md",
    "excuse_generator_instructor_llmnode_excuse_engine_user_1": "@prompts/excuse-generator_instructor-llmnode-excuse-engine_user_1.md"
  },
  "modelConfigs": {
    "excuse_generator_instructor_llmnode_excuse_engine_generative_model_name": "@model-configs/excuse-generator_instructor-llmnode-excuse-engine_generative-model-name.ts"
  },
  "scripts": {
    "excuse_generator_code_node_931_code": "@scripts/excuse-generator_code-node-931_code.ts",
    "excuse_generator_code_node_merge_excuse_code": "@scripts/excuse-generator_code-node-merge-excuse_code.ts",
    "excuse_generator_code_node_selection_response_code": "@scripts/excuse-generator_code-node-selection-response_code.ts",
    "excuse_generator_code_node_494_code": "@scripts/excuse-generator_code-node-494_code.ts",
    "excuse_generator_code_node_chat_response_code": "@scripts/excuse-generator_code-node-chat-response_code.ts"
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
        "advance_schema": "{\n  \"sessionId\": \"string\",\n  \"message\": \"string\",\n  \"messageType\": \"string\",\n  \"chatHistory\": \"[string]\",\n  \"selectedExcuse\": \"string\",\n  \"selectedPerson\": \"string\"\n}"
      }
    }
  },
  {
    "id": "apiNode_loadExcuseHistory",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "url": "{{secrets.project.UPSTASH_URL}}/get/excuseHistory:{{triggerNode_1.output.sessionId}}",
        "body": "",
        "method": "GET",
        "headers": "{\"Authorization\":\"{{secrets.project.UPSTASH_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "Load Excuse History",
        "retry_deplay": "0",
        "convertXmlResponseToJson": true
      }
    }
  },
  {
    "id": "apiNode_loadContext",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "url": "{{secrets.project.UPSTASH_URL}}/get/personalContext:{{triggerNode_1.output.sessionId}}",
        "body": "",
        "method": "GET",
        "headers": "{\"Authorization\":\"{{secrets.project.UPSTASH_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "Load Personal Context",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_931",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_931",
        "code": "@scripts/excuse-generator_code-node-931_code.ts",
        "nodeName": "sanitizePersonalContext"
      }
    }
  },
  {
    "id": "conditionNode_messageType",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Is Selection?",
        "conditions": [
          {
            "label": "Is Selection",
            "value": "conditionNode_messageType-codeNode_mergeExcuse",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.messageType}}\",\n      \"operator\": \"==\",\n      \"value\": \"selection\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_messageType-InstructorLLMNode_excuseEngine",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "codeNode_mergeExcuse",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_mergeExcuse",
        "code": "@scripts/excuse-generator_code-node-merge-excuse_code.ts",
        "nodeName": "Merge Excuse Into History"
      }
    }
  },
  {
    "id": "apiNode_saveExcuseHistory",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_saveExcuseHistory",
        "url": "{{secrets.project.UPSTASH_URL}}/set/excuseHistory:{{triggerNode_1.output.sessionId}}",
        "body": "{{codeNode_mergeExcuse.output.updatedHistory}}",
        "method": "POST",
        "headers": "{\"Authorization\":\"{{secrets.project.UPSTASH_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "Save Excuse History",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "codeNode_selectionResponse",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_selectionResponse",
        "code": "@scripts/excuse-generator_code-node-selection-response_code.ts",
        "nodeName": "Selection Goodbye Response"
      }
    }
  },
  {
    "id": "InstructorLLMNode_excuseEngine",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_excuseEngine",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"type\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"MUST be exactly one of these three values: 'question', 'options', or 'irrelevant'. Nothing else.\"\n    },\n    \"message\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"When type is 'question': write EXACTLY ONE clarifying question here as a plain string. Do NOT write the user's message here. Do NOT put multiple questions here. Example: 'Who is the excuse for — your boss, a friend, or someone else?'. When type is 'options': this MUST be an empty string. When type is 'irrelevant': write a short polite redirect here.\"\n    },\n    \"items\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      },\n      \"description\": \"When type is 'options': an array of EXACTLY 3 complete, ready-to-use excuse sentences. Excuse 1 is safe, Excuse 2 is moderately creative, Excuse 3 is bold. When type is 'question' OR 'irrelevant': this MUST be an empty array [].\"\n    },\n    \"person\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Always return this field. Lowercase name or role of who the excuse is for (e.g. 'boss', 'mom', 'sarah'). Return empty string \\\"\\\" when type is 'question' or 'irrelevant'.\"\n    },\n    \"contextUpdated\": {\n      \"type\": \"boolean\",\n      \"required\": true,\n      \"description\": \"Always return this field. Return true ONLY if the user revealed new personal info not already in personal context. Otherwise return false.\"\n    },\n    \"updatedContext\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Always return this field. When contextUpdated is true: complete updated personal context as stringified JSON. When contextUpdated is false: return empty string \\\"\\\".\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "llm-system-prompt",
            "role": "system",
            "content": "@prompts/excuse-generator_instructor-llmnode-excuse-engine_system_0.md"
          },
          {
            "id": "llm-user-prompt",
            "role": "user",
            "content": "@prompts/excuse-generator_instructor-llmnode-excuse-engine_user_1.md"
          }
        ],
        "memories": "",
        "messages": "{{triggerNode_1.output.chatHistory}}",
        "nodeName": "Excuse Engine",
        "attachments": "",
        "generativeModelName": "@model-configs/excuse-generator_instructor-llmnode-excuse-engine_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_494",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_494",
        "code": "@scripts/excuse-generator_code-node-494_code.ts",
        "nodeName": "MergeContext"
      }
    }
  },
  {
    "id": "conditionNode_contextUpdated",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Context Updated?",
        "conditions": [
          {
            "label": "Save Context",
            "value": "conditionNode_contextUpdated-apiNode_saveContext",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{InstructorLLMNode_excuseEngine.output.contextUpdated}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_contextUpdated-addNode_contextMerge",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "apiNode_saveContext",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_saveContext",
        "url": "{{secrets.project.UPSTASH_URL}}/set/personalContext:{{triggerNode_1.output.sessionId}}",
        "body": "{{codeNode_494.output.mergedContext}}",
        "method": "POST",
        "headers": "{\"Authorization\":\"{{secrets.project.UPSTASH_TOKEN}}\"}",
        "retries": "0",
        "nodeName": "Save Personal Context",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "addNode_contextMerge",
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
    "id": "addNode_afterContext",
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
    "id": "codeNode_chatResponse",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_chatResponse",
        "code": "@scripts/excuse-generator_code-node-chat-response_code.ts",
        "nodeName": "LLM Chat Response"
      }
    }
  },
  {
    "id": "endNode_final",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "endNode",
      "values": {
        "nodeName": "End"
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
        "outputMapping": "{\n  \"response\": \"{{codeNode_chatResponse.output}}\",\n  \"selectionConfirmed\": \"{{codeNode_selectionResponse.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-apiNode_loadContext",
    "source": "triggerNode_1",
    "target": "apiNode_loadContext",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-apiNode_loadExcuseHistory",
    "source": "triggerNode_1",
    "target": "apiNode_loadExcuseHistory",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_loadExcuseHistory-conditionNode_messageType",
    "source": "apiNode_loadExcuseHistory",
    "target": "conditionNode_messageType",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_messageType-codeNode_mergeExcuse",
    "source": "conditionNode_messageType",
    "target": "codeNode_mergeExcuse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_messageType-InstructorLLMNode_excuseEngine",
    "source": "conditionNode_messageType",
    "target": "InstructorLLMNode_excuseEngine",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_mergeExcuse-apiNode_saveExcuseHistory",
    "source": "codeNode_mergeExcuse",
    "target": "apiNode_saveExcuseHistory",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_saveExcuseHistory-codeNode_selectionResponse",
    "source": "apiNode_saveExcuseHistory",
    "target": "codeNode_selectionResponse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_loadExcuseHistory-InstructorLLMNode_excuseEngine",
    "source": "apiNode_loadExcuseHistory",
    "target": "InstructorLLMNode_excuseEngine",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_contextUpdated-apiNode_saveContext",
    "source": "conditionNode_contextUpdated",
    "target": "apiNode_saveContext",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_contextUpdated-addNode_contextMerge",
    "source": "conditionNode_contextUpdated",
    "target": "addNode_contextMerge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "addNode_contextMerge-addNode_afterContext",
    "source": "addNode_contextMerge",
    "target": "addNode_afterContext",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_afterContext-codeNode_chatResponse",
    "source": "addNode_afterContext",
    "target": "codeNode_chatResponse",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_selectionResponse-endNode_final",
    "source": "codeNode_selectionResponse",
    "target": "endNode_final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_chatResponse-endNode_final",
    "source": "codeNode_chatResponse",
    "target": "endNode_final",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_final-responseNode_triggerNode_1",
    "source": "endNode_final",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_loadContext-codeNode_931",
    "source": "apiNode_loadContext",
    "target": "codeNode_931",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_931-conditionNode_messageType",
    "source": "codeNode_931",
    "target": "conditionNode_messageType",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "apiNode_saveContext-addNode_afterContext-350",
    "source": "apiNode_saveContext",
    "target": "addNode_afterContext",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_excuseEngine-codeNode_494",
    "source": "InstructorLLMNode_excuseEngine",
    "target": "codeNode_494",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_494-conditionNode_contextUpdated",
    "source": "codeNode_494",
    "target": "conditionNode_contextUpdated",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
