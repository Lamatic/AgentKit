// Flow: sales-to-cs-handoff-automation

// -- Meta --
export const meta = {
  "name": "Sales-to-CS Handoff-Automation",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Paarth Gala",
    "email": "paarthgala1@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_1": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_2": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_5": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_4": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_3": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_2": [
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
    "sales_to_cs_handoff_automation_instructor_llmnode_1_system_0": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-1_system_0.md",
    "sales_to_cs_handoff_automation_instructor_llmnode_1_user_1": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-1_user_1.md",
    "sales_to_cs_handoff_automation_llmnode_1_system_0": "@prompts/sales-to-cs-handoff-automation_llmnode-1_system_0.md",
    "sales_to_cs_handoff_automation_llmnode_1_user_1": "@prompts/sales-to-cs-handoff-automation_llmnode-1_user_1.md",
    "sales_to_cs_handoff_automation_instructor_llmnode_2_system_0": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-2_system_0.md",
    "sales_to_cs_handoff_automation_instructor_llmnode_2_user_1": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-2_user_1.md",
    "sales_to_cs_handoff_automation_llmnode_5_system_0": "@prompts/sales-to-cs-handoff-automation_llmnode-5_system_0.md",
    "sales_to_cs_handoff_automation_llmnode_5_user_1": "@prompts/sales-to-cs-handoff-automation_llmnode-5_user_1.md",
    "sales_to_cs_handoff_automation_llmnode_4_system_0": "@prompts/sales-to-cs-handoff-automation_llmnode-4_system_0.md",
    "sales_to_cs_handoff_automation_llmnode_4_user_1": "@prompts/sales-to-cs-handoff-automation_llmnode-4_user_1.md",
    "sales_to_cs_handoff_automation_llmnode_3_system_0": "@prompts/sales-to-cs-handoff-automation_llmnode-3_system_0.md",
    "sales_to_cs_handoff_automation_llmnode_3_user_1": "@prompts/sales-to-cs-handoff-automation_llmnode-3_user_1.md",
    "sales_to_cs_handoff_automation_llmnode_2_system_0": "@prompts/sales-to-cs-handoff-automation_llmnode-2_system_0.md",
    "sales_to_cs_handoff_automation_llmnode_2_user_1": "@prompts/sales-to-cs-handoff-automation_llmnode-2_user_1.md"
  },
  "modelConfigs": {
    "sales_to_cs_handoff_automation_instructor_llmnode_1_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_instructor-llmnode-1_generative-model-name.ts",
    "sales_to_cs_handoff_automation_llmnode_1_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_llmnode-1_generative-model-name.ts",
    "sales_to_cs_handoff_automation_instructor_llmnode_2_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_instructor-llmnode-2_generative-model-name.ts",
    "sales_to_cs_handoff_automation_llmnode_5_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_llmnode-5_generative-model-name.ts",
    "sales_to_cs_handoff_automation_llmnode_4_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_llmnode-4_generative-model-name.ts",
    "sales_to_cs_handoff_automation_llmnode_3_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_llmnode-3_generative-model-name.ts",
    "sales_to_cs_handoff_automation_llmnode_2_generative_model_name": "@model-configs/sales-to-cs-handoff-automation_llmnode-2_generative-model-name.ts"
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
        "nodeName": "1 - API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"company_name\": \"string\",\n  \"deal_value\": \"string\",\n  \"sales_transcript\": \"string\",\n  \"crm_notes\": \"string\",\n  \"timeline\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_1",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"validation_status\": { \"type\": \"string\", \"required\": true },\n    \"continue_pipeline\": { \"type\": \"boolean\", \"required\": true },\n    \"reason\": { \"type\": \"string\", \"required\": true }\n  }\n}",
        "prompts": [
          {
            "id": "validation-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-1_system_0.md"
          },
          {
            "id": "validation-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{triggerNode_1.output.company_name}} {{triggerNode_1.output.deal_value}} {{triggerNode_1.output.sales_transcript}} {{triggerNode_1.output.crm_notes}} {{triggerNode_1.output.timeline}}",
        "nodeName": "2 - Validation and Structuring Agent",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_instructor-llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "branchNode_1",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "id": "branchNode_1",
        "branches": [
          {
            "label": "Validation Passed",
            "value": "InstructorLLMNode_2",
            "condition": "{{InstructorLLMNode_1.output.continue_pipeline}} == true"
          },
          {
            "label": "Validation Failed",
            "value": "LLMNode_1",
            "condition": "{{InstructorLLMNode_1.output.continue_pipeline}} == false"
          }
        ],
        "nodeName": "3 - Validation Gate"
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_1",
        "tools": [],
        "prompts": [
          {
            "id": "escalation-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-1_system_0.md"
          },
          {
            "id": "escalation-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-1_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_1.output}}",
        "nodeName": "4 - Escalation Summary",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_llmnode-1_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_2",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"complexity_score\": { \"type\": \"number\", \"required\": true },\n    \"onboarding_tier\": { \"type\": \"string\", \"required\": true },\n    \"confidence_score\": { \"type\": \"number\", \"required\": true },\n    \"onboarding_risks\": {\n      \"type\": \"array\", \"items\": { \"type\": \"string\" }, \"required\": true\n    },\n    \"technical_requirements\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"customer_goals\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"promise_audit\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } },\n    \"onboarding_feasibility\": { \"type\": \"string\" }\n  }\n}",
        "prompts": [
          {
            "id": "intelligence-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-2_system_0.md"
          },
          {
            "id": "intelligence-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_instructor-llmnode-2_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_1.output}}",
        "nodeName": "5 - Deal Intelligence Agent",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_instructor-llmnode-2_generative-model-name.ts"
      }
    }
  },
  {
    "id": "branchNode_2",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Enterprise",
            "value": "variablesNode_2",
            "condition": "{{InstructorLLMNode_2.output.complexity_score}} > 7"
          },
          {
            "label": "Standard",
            "value": "variablesNode_3",
            "condition": "true"
          }
        ],
        "nodeName": "7 - Routing Logic"
      }
    }
  },
  {
    "id": "variablesNode_3",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "id": "variablesNode_3",
        "mapping": "{\n  \"onboarding_route\": {\n    \"type\": \"string\",\n    \"value\": \"standard\"\n  }\n}",
        "nodeName": "8b - Standard Route"
      }
    }
  },
  {
    "id": "variablesNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "id": "variablesNode_2",
        "mapping": "{\n  \"onboarding_route\": {\n    \"type\": \"string\",\n    \"value\": \"enterprise\"\n  }\n}",
        "nodeName": "8a - Enterprise Route"
      }
    }
  },
  {
    "id": "LLMNode_5",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_5",
        "tools": [],
        "prompts": [
          {
            "id": "mgmt-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-5_system_0.md"
          },
          {
            "id": "mgmt-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-5_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_2.output}}",
        "nodeName": "12 - Management Summary",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_llmnode-5_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_4",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_4",
        "tools": [],
        "prompts": [
          {
            "id": "email-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-4_system_0.md"
          },
          {
            "id": "email-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-4_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_2.output}}",
        "nodeName": "11 - Customer Kickoff Email",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_llmnode-4_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_3",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_3",
        "tools": [],
        "prompts": [
          {
            "id": "eng-brief-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-3_system_0.md"
          },
          {
            "id": "eng-brief-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-3_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_2.output}}",
        "nodeName": "10 - Engineering Brief",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_llmnode-3_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_2",
        "tools": [],
        "prompts": [
          {
            "id": "cs-brief-system-prompt",
            "role": "system",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-2_system_0.md"
          },
          {
            "id": "cs-brief-user-prompt",
            "role": "user",
            "content": "@prompts/sales-to-cs-handoff-automation_llmnode-2_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "{{InstructorLLMNode_2.output}}",
        "nodeName": "9 - CS Handoff Brief",
        "modelLogic": [
          {
            "type": "fallback",
            "config": "configA",
            "onTimeout": false,
            "fallbackConfig": "configB"
          }
        ],
        "attachments": "",
        "generativeModelName": "@model-configs/sales-to-cs-handoff-automation_llmnode-2_generative-model-name.ts"
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
        "nodeName": "13 - API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"validation_status\": \"{{InstructorLLMNode_1.output.validation_status}}\",\n  \"continue_pipeline\": \"{{InstructorLLMNode_1.output.continue_pipeline}}\",\n  \"validation_reason\": \"{{InstructorLLMNode_1.output.reason}}\",\n  \"complexity_score\": \"{{InstructorLLMNode_2.output.complexity_score}}\",\n  \"onboarding_tier\": \"{{InstructorLLMNode_2.output.onboarding_tier}}\",\n  \"confidence_score\": \"{{InstructorLLMNode_2.output.confidence_score}}\",\n  \"onboarding_risks\": \"{{InstructorLLMNode_2.output.onboarding_risks}}\",\n  \"onboarding_route\": \"{{variablesNode_2.output.onboarding_route}}{{variablesNode_3.output.onboarding_route}}\",\n  \"escalation_summary\": \"{{LLMNode_1.output.generatedResponse}}\",\n  \"cs_brief\": \"{{LLMNode_2.output.generatedResponse}}\",\n  \"engineering_brief\": \"{{LLMNode_3.output.generatedResponse}}\",\n  \"customer_email\": \"{{LLMNode_4.output.generatedResponse}}\",\n  \"management_summary\": \"{{LLMNode_5.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "xy-edge__triggerNode_1bottom-InstructorLLMNode_1top",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__InstructorLLMNode_1bottom-branchNode_1top",
    "source": "InstructorLLMNode_1",
    "target": "branchNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__branchNode_1bottom-LLMNode_1top",
    "source": "branchNode_1",
    "target": "LLMNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__branchNode_1bottom-InstructorLLMNode_2top",
    "source": "branchNode_1",
    "target": "InstructorLLMNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__LLMNode_1bottom-responseNode_triggerNode_1top",
    "source": "LLMNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__branchNode_2bottom-variablesNode_2top",
    "source": "branchNode_2",
    "target": "variablesNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__branchNode_2bottom-variablesNode_3top",
    "source": "branchNode_2",
    "target": "variablesNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_2bottom-LLMNode_2top",
    "source": "variablesNode_2",
    "target": "LLMNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_2bottom-LLMNode_3top",
    "source": "variablesNode_2",
    "target": "LLMNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_2bottom-LLMNode_4top",
    "source": "variablesNode_2",
    "target": "LLMNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_2bottom-LLMNode_5top",
    "source": "variablesNode_2",
    "target": "LLMNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_3bottom-LLMNode_2top",
    "source": "variablesNode_3",
    "target": "LLMNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_3bottom-LLMNode_3top",
    "source": "variablesNode_3",
    "target": "LLMNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_3bottom-LLMNode_4top",
    "source": "variablesNode_3",
    "target": "LLMNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__variablesNode_3bottom-LLMNode_5top",
    "source": "variablesNode_3",
    "target": "LLMNode_5",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__LLMNode_2bottom-responseNode_triggerNode_1top",
    "source": "LLMNode_2",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__LLMNode_3bottom-responseNode_triggerNode_1top",
    "source": "LLMNode_3",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__LLMNode_4bottom-responseNode_triggerNode_1top",
    "source": "LLMNode_4",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__LLMNode_5bottom-responseNode_triggerNode_1top",
    "source": "LLMNode_5",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_2-branchNode_2-678",
    "source": "InstructorLLMNode_2",
    "target": "branchNode_2",
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
