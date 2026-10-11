// Flow: audit-kb

// -- Meta --
export const meta = {
  "name": "audit-kb",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Ayush kumar",
    "email": "ayushkumar44344@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_148": [
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
    "audit_kb_instructor_llmnode_148_system_0": "@prompts/audit-kb_instructor-llmnode-148_system_0.md",
    "audit_kb_instructor_llmnode_148_user_1": "@prompts/audit-kb_instructor-llmnode-148_user_1.md"
  },
  "modelConfigs": {
    "audit_kb_instructor_llmnode_148_generative_model_name": "@model-configs/audit-kb_instructor-llmnode-148_generative-model-name.ts"
  },
  "scripts": {
    "audit_kb_code_node_344_code": "@scripts/audit-kb_code-node-344_code.ts",
    "audit_kb_code_node_615_code": "@scripts/audit-kb_code-node-615_code.ts"
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
        "advance_schema": "{\n  \"documents_json\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_344",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/audit-kb_code-node-344_code.ts",
        "nodeName": "Extract Candidates"
      }
    }
  },
  {
    "id": "conditionNode_618",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Has Candidates",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_618-addNode_780",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_344.output.candidate_count}}\",\n      \"operator\": \">\",\n      \"value\": \"0\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_618-addNode_224",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "endNode_597",
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
    "id": "addNode_780",
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
    "id": "InstructorLLMNode_148",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"results\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"candidate_id\": {\n            \"type\": \"string\"\n          },\n          \"is_real_conflict\": {\n            \"type\": \"boolean\"\n          },\n          \"severity\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"Critical\",\n              \"High\",\n              \"Medium\",\n              \"Low\"\n            ]\n          },\n          \"conflict_summary\": {\n            \"type\": \"string\"\n          },\n          \"authoritative_source\": {\n            \"type\": \"string\"\n          },\n          \"reasoning\": {\n            \"type\": \"string\"\n          },\n          \"suggested_patch\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"file_to_update\": {\n                \"type\": \"string\"\n              },\n              \"current_text\": {\n                \"type\": \"string\"\n              },\n              \"replacement_text\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/audit-kb_instructor-llmnode-148_system_0.md"
          },
          {
            "id": "f81fdbf9-9153-4441-ba56-33cb59dc65e7",
            "role": "user",
            "content": "@prompts/audit-kb_instructor-llmnode-148_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Judge Conflicts",
        "attachments": "",
        "generativeModelName": "@model-configs/audit-kb_instructor-llmnode-148_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_615",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/audit-kb_code-node-615_code.ts",
        "nodeName": "Verify Findings"
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
        "outputMapping": "{\n  \"findings\": \"{{codeNode_615.output.findings}}\",\n  \"stats\": \"{{codeNode_615.output.stats}}\",\n  \"candidate_count\": \"{{codeNode_344.output.candidate_count}}\",\n  \"docs_scanned\": \"{{codeNode_344.output.docs_scanned}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_344",
    "source": "triggerNode_1",
    "target": "codeNode_344",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_344-conditionNode_618",
    "source": "codeNode_344",
    "target": "conditionNode_618",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_618-addNode_780",
    "source": "conditionNode_618",
    "target": "addNode_780",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_618-addNode_224",
    "source": "conditionNode_618",
    "target": "endNode_597",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "addNode_780-InstructorLLMNode_148",
    "source": "addNode_780",
    "target": "InstructorLLMNode_148",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_148-codeNode_615",
    "source": "InstructorLLMNode_148",
    "target": "codeNode_615",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_615-responseNode_triggerNode_1",
    "source": "codeNode_615",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_597-InstructorLLMNode_148-693",
    "source": "endNode_597",
    "target": "InstructorLLMNode_148",
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
