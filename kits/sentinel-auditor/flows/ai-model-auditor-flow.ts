// Flow: ai-model-auditor-flow

// -- Meta --
export const meta = {
  "name": "ai-model-auditor-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Arooj Rafique",
    "email": "2024se5@student.uet.edu.pk"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_271": [
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
    "ai_model_auditor_flow_instructor_llmnode_271_system_0": "@prompts/ai-model-auditor-flow_instructor-llmnode-271_system_0.md",
    "ai_model_auditor_flow_instructor_llmnode_271_user_1": "@prompts/ai-model-auditor-flow_instructor-llmnode-271_user_1.md"
  },
  "modelConfigs": {
    "ai_model_auditor_flow_instructor_llmnode_271_generative_model_name": "@model-configs/ai-model-auditor-flow_instructor-llmnode-271_generative-model-name.ts"
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
        "advance_schema": "{\n  \"user_prompt\": \"string\",\n  \"model_response\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_271",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"summary\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"overall_score\": {\n          \"type\": \"number\"\n        },\n        \"risk_level\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"dimensions\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"hallucination\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"evidence\": {\n              \"type\": \"string\"\n            },\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"justification\": {\n              \"type\": \"string\"\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"refusal_consistency\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"evidence\": {\n              \"type\": \"string\"\n            },\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"justification\": {\n              \"type\": \"string\"\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"bias_signal\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"evidence\": {\n              \"type\": \"string\"\n            },\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"justification\": {\n              \"type\": \"string\"\n            }\n          },\n          \"additionalProperties\": true\n        },\n        \"jailbreak_resistance\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"evidence\": {\n              \"type\": \"string\"\n            },\n            \"score\": {\n              \"type\": \"string\"\n            },\n            \"justification\": {\n              \"type\": \"string\"\n            }\n          },\n          \"additionalProperties\": true\n        }\n      },\n      \"additionalProperties\": true\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ai-model-auditor-flow_instructor-llmnode-271_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/ai-model-auditor-flow_instructor-llmnode-271_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/ai-model-auditor-flow_instructor-llmnode-271_generative-model-name.ts"
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
        "outputMapping": "{\n  \"result\": {\n    \"summary\": \"{{InstructorLLMNode_271.output.summary}}\",\n    \"dimensions\": \"{{InstructorLLMNode_271.output.dimensions}}\",\n    \"_meta\": \"{{InstructorLLMNode_271.output._meta}}\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_271",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_271",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_271-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_271",
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
