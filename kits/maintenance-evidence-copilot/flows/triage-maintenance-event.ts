// Flow: triage-maintenance-event

// -- Meta --
export const meta = {
  "name": "triage-maintenance-event",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Anudeep Reddy",
    "email": "anudeepreddy332@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_161": [
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
    "triage_maintenance_event_instructor_llmnode_161_system_0": "@prompts/triage-maintenance-event_instructor-llmnode-161_system_0.md",
    "triage_maintenance_event_instructor_llmnode_161_user_1": "@prompts/triage-maintenance-event_instructor-llmnode-161_user_1.md"
  },
  "modelConfigs": {
    "triage_maintenance_event_instructor_llmnode_161_generative_model_name": "@model-configs/triage-maintenance-event_instructor-llmnode-161_generative-model-name.ts"
  },
  "scripts": {
    "triage_maintenance_event_code_node_973_code": "@scripts/triage-maintenance-event_code-node-973_code.ts",
    "triage_maintenance_event_code_node_301_code": "@scripts/triage-maintenance-event_code-node-301_code.ts"
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
        "advance_schema": "{\n  \"eventId\": \"string\",\n  \"occurredAt\": \"string\",\n  \"vibrationRmsMmS\": \"float\",\n  \"bearingTemperatureC\": \"float\",\n  \"shaftSpeedRpm\": \"float\",\n  \"motorLoadPct\": \"float\",\n  \"operatorNote\": \"string\"\n}"
      }
    }
  },
  {
    "id": "codeNode_973",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/triage-maintenance-event_code-node-973_code.ts",
        "nodeName": "Prepare_Evidence"
      }
    }
  },
  {
    "id": "InstructorLLMNode_161",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"supportingEvidence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"statement\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"sourceIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"contradictoryEvidence\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"statement\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"sourceIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"possibleExplanations\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"label\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"supportingSourceIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"contradictorySourceIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"unknowns\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"description\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"neededToResolve\": {\n            \"type\": \"string\",\n            \"required\": true\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"recommendedChecks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"action\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"rationale\": {\n            \"type\": \"string\",\n            \"required\": true\n          },\n          \"sourceIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/triage-maintenance-event_instructor-llmnode-161_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/triage-maintenance-event_instructor-llmnode-161_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Synthesize_Assessment_JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/triage-maintenance-event_instructor-llmnode-161_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_301",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/triage-maintenance-event_code-node-301_code.ts",
        "nodeName": "Guard_And_Assemble"
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
        "outputMapping": "{\n  \"assessmentJson\": \"{{codeNode_301.output.responseJson}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_973",
    "source": "triggerNode_1",
    "target": "codeNode_973",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_973-InstructorLLMNode_161",
    "source": "codeNode_973",
    "target": "InstructorLLMNode_161",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_161-codeNode_301",
    "source": "InstructorLLMNode_161",
    "target": "codeNode_301",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_301-responseNode_triggerNode_1",
    "source": "codeNode_301",
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
