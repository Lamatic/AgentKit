// Flow: agent-reliability-audit

// -- Meta --
export const meta = {
  "name": "agent-reliability-audit",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Lakshya Kumar",
    "email": "lakshyakumar987@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_949": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_990": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_186": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_452": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_736": [
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
    "agent_reliability_audit_instructor_llmnode_949_system_0": "@prompts/agent-reliability-audit_instructor-llmnode-949_system_0.md",
    "agent_reliability_audit_instructor_llmnode_949_user_1": "@prompts/agent-reliability-audit_instructor-llmnode-949_user_1.md",
    "agent_reliability_audit_instructor_llmnode_990_system_0": "@prompts/agent-reliability-audit_instructor-llmnode-990_system_0.md",
    "agent_reliability_audit_instructor_llmnode_990_user_1": "@prompts/agent-reliability-audit_instructor-llmnode-990_user_1.md",
    "agent_reliability_audit_instructor_llmnode_186_system_0": "@prompts/agent-reliability-audit_instructor-llmnode-186_system_0.md",
    "agent_reliability_audit_instructor_llmnode_186_user_1": "@prompts/agent-reliability-audit_instructor-llmnode-186_user_1.md",
    "agent_reliability_audit_instructor_llmnode_452_system_0": "@prompts/agent-reliability-audit_instructor-llmnode-452_system_0.md",
    "agent_reliability_audit_instructor_llmnode_452_user_1": "@prompts/agent-reliability-audit_instructor-llmnode-452_user_1.md",
    "agent_reliability_audit_instructor_llmnode_736_system_0": "@prompts/agent-reliability-audit_instructor-llmnode-736_system_0.md",
    "agent_reliability_audit_instructor_llmnode_736_user_1": "@prompts/agent-reliability-audit_instructor-llmnode-736_user_1.md"
  },
  "modelConfigs": {
    "agent_reliability_audit_instructor_llmnode_949_generative_model_name": "@model-configs/agent-reliability-audit_instructor-llmnode-949_generative-model-name.ts",
    "agent_reliability_audit_instructor_llmnode_990_generative_model_name": "@model-configs/agent-reliability-audit_instructor-llmnode-990_generative-model-name.ts",
    "agent_reliability_audit_instructor_llmnode_186_generative_model_name": "@model-configs/agent-reliability-audit_instructor-llmnode-186_generative-model-name.ts",
    "agent_reliability_audit_instructor_llmnode_452_generative_model_name": "@model-configs/agent-reliability-audit_instructor-llmnode-452_generative-model-name.ts",
    "agent_reliability_audit_instructor_llmnode_736_generative_model_name": "@model-configs/agent-reliability-audit_instructor-llmnode-736_generative-model-name.ts"
  },
  "scripts": {
    "agent_reliability_audit_code_node_587_code": "@scripts/agent-reliability-audit_code-node-587_code.ts",
    "agent_reliability_audit_code_node_422_code": "@scripts/agent-reliability-audit_code-node-422_code.ts",
    "agent_reliability_audit_code_node_961_code": "@scripts/agent-reliability-audit_code-node-961_code.ts",
    "agent_reliability_audit_code_node_175_code": "@scripts/agent-reliability-audit_code-node-175_code.ts",
    "agent_reliability_audit_code_node_779_code": "@scripts/agent-reliability-audit_code-node-779_code.ts"
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
        "advance_schema": "{\n  \"systemPrompt\": \"string\",\n  \"toolSchema\": \"string\",\n  \"constitutionDoc\": \"string\",\n  \"targetEndpoint\": {\n    \"url\": \"string\",\n    \"authHeader\": \"string\"\n  },\n  \"referenceQA\": \"string\",\n  \"depth\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_949",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"promptQualityScore\": {\n      \"type\": \"number\",\n      \"required\": true\n    },\n    \"guardrailCoverageScore\": {\n      \"type\": \"number\",\n      \"required\": true\n    },\n    \"criticalIssues\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"issue\": {\n            \"type\": \"string\"\n          },\n          \"recommendation\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"warnings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"suggestions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-949_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-949_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Static analyzer",
        "attachments": "",
        "generativeModelName": "@model-configs/agent-reliability-audit_instructor-llmnode-949_generative-model-name.ts"
      }
    }
  },
  {
    "id": "conditionNode_230",
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
            "label": "Condition 1",
            "value": "conditionNode_230-addNode_447",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.targetEndpoint.url}}\",\n      \"operator\": \"!=\",\n      \"value\": \"\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_230-addNode_869",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "InstructorLLMNode_990",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"rewrittenPrompt\": {\n      \"type\": \"string\"\n    },\n    \"changeLog\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"change\": {\n            \"type\": \"string\"\n          },\n          \"findingAddressed\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-990_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-990_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Static Rewriter",
        "attachments": "",
        "generativeModelName": "@model-configs/agent-reliability-audit_instructor-llmnode-990_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_587",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agent-reliability-audit_code-node-587_code.ts",
        "nodeName": "Static Report Compiler"
      }
    }
  },
  {
    "id": "InstructorLLMNode_186",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"probes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"payload\": {\n            \"type\": \"string\"\n          },\n          \"expectedBehavior\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-186_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-186_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Probe Generator.",
        "attachments": "",
        "generativeModelName": "@model-configs/agent-reliability-audit_instructor-llmnode-186_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_422",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agent-reliability-audit_code-node-422_code.ts",
        "nodeName": "Test Executor"
      }
    }
  },
  {
    "id": "InstructorLLMNode_452",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"verdicts\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"probeId\": {\n            \"type\": \"string\"\n          },\n          \"category\": {\n            \"type\": \"string\"\n          },\n          \"verdict\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          },\n          \"rationale\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-452_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-452_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Judge",
        "attachments": "",
        "generativeModelName": "@model-configs/agent-reliability-audit_instructor-llmnode-452_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_961",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agent-reliability-audit_code-node-961_code.ts",
        "nodeName": "Aggregator"
      }
    }
  },
  {
    "id": "InstructorLLMNode_736",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"rewrittenPrompt\": {\n      \"type\": \"string\"\n    },\n    \"changeLog\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"change\": {\n            \"type\": \"string\"\n          },\n          \"findingAddressed\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-736_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/agent-reliability-audit_instructor-llmnode-736_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Rewriter",
        "attachments": "",
        "generativeModelName": "@model-configs/agent-reliability-audit_instructor-llmnode-736_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_175",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agent-reliability-audit_code-node-175_code.ts",
        "nodeName": "Report Compiler."
      }
    }
  },
  {
    "id": "codeNode_779",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/agent-reliability-audit_code-node-779_code.ts",
        "nodeName": "Final Report"
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
        "outputMapping": "{\n  \"report\": \"{{codeNode_779.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_949",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_949",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_949-conditionNode_230",
    "source": "InstructorLLMNode_949",
    "target": "conditionNode_230",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_230-InstructorLLMNode_186-281",
    "source": "conditionNode_230",
    "target": "InstructorLLMNode_186",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "InstructorLLMNode_186-codeNode_422",
    "source": "InstructorLLMNode_186",
    "target": "codeNode_422",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_422-InstructorLLMNode_452",
    "source": "codeNode_422",
    "target": "InstructorLLMNode_452",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_452-codeNode_961",
    "source": "InstructorLLMNode_452",
    "target": "codeNode_961",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_961-InstructorLLMNode_736",
    "source": "codeNode_961",
    "target": "InstructorLLMNode_736",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_736-codeNode_175",
    "source": "InstructorLLMNode_736",
    "target": "codeNode_175",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_230-InstructorLLMNode_990-642",
    "source": "conditionNode_230",
    "target": "InstructorLLMNode_990",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "codeNode_175-codeNode_779",
    "source": "codeNode_175",
    "target": "codeNode_779",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_779-responseNode_triggerNode_1",
    "source": "codeNode_779",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_990-codeNode_587",
    "source": "InstructorLLMNode_990",
    "target": "codeNode_587",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_587-codeNode_779",
    "source": "codeNode_587",
    "target": "codeNode_779",
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
