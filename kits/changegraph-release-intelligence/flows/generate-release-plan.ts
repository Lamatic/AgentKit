// Flow: generate-release-plan

// -- Meta --
export const meta = {
  "name": "generate-release-plan",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "MAYANK VERMA",
    "email": "mayankverma210405@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_863": [
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
    "generate_release_plan_instructor_llmnode_863_system_0": "@prompts/generate-release-plan_instructor-llmnode-863_system_0.md",
    "generate_release_plan_instructor_llmnode_863_user_1": "@prompts/generate-release-plan_instructor-llmnode-863_user_1.md"
  },
  "modelConfigs": {
    "generate_release_plan_instructor_llmnode_863_generative_model_name": "@model-configs/generate-release-plan_instructor-llmnode-863_generative-model-name.ts"
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
        "advance_schema": "{\n  \"flowPurpose\": \"string\",\n  \"baselineVersion\": \"string\",\n  \"candidateVersion\": \"string\",\n  \"releaseContext\": \"string\",\n  \"changePackage\": \"string\",\n  \"semanticAnalysis\": \"string\",\n  \"riskScore\": \"int\",\n  \"promotionDecision\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_863",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"decisionSummary\": {\n      \"type\": \"string\",\n      \"description\": \"A concise explanation of the supplied promotion decision and its strongest supporting evidence.\"\n    },\n    \"promotionDecision\": {\n      \"type\": \"string\",\n      \"description\": \"The exact deterministic promotion decision supplied as input.\"\n    },\n    \"riskScore\": {\n      \"type\": \"string\",\n      \"description\": \"The exact deterministic risk score supplied as input.\"\n    },\n    \"blockers\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"blockerId\": {\n            \"type\": \"string\"\n          },\n          \"relatedChangeIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          },\n          \"resolutionRequired\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"Evidence-backed problems that must be resolved before promotion.\"\n    },\n    \"targetedTests\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"testId\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"objective\": {\n            \"type\": \"string\"\n          },\n          \"relatedChangeIds\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"testType\": {\n            \"type\": \"string\"\n          },\n          \"priority\": {\n            \"type\": \"string\"\n          },\n          \"expectedEvidence\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"Regression tests derived from specific workflow changes.\"\n    },\n    \"deploymentChecklist\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"rollbackManifest\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"rollbackTarget\": {\n          \"type\": \"string\"\n        },\n        \"componentsToRestore\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"environmentChangesToRevert\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"postRollbackChecks\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"releaseNotes\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"assumptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"unknowns\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-release-plan_instructor-llmnode-863_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/generate-release-plan_instructor-llmnode-863_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Release Plan Generator",
        "attachments": "",
        "generativeModelName": "@model-configs/generate-release-plan_instructor-llmnode-863_generative-model-name.ts"
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
        "outputMapping": "{\n  \"releasePlan\": \"{{InstructorLLMNode_863.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_863",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_863",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_863-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_863",
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
