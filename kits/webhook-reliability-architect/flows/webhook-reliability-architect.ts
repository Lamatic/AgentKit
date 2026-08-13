// Flow: webhook-reliability-architect

// -- Meta --
export const meta = {
  "name": "Webhook Reliability Architect",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Amar Kumar",
    "email": "amarkumar05092003@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_437": [
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
    "webhook_reliability_architect_instructor_llmnode_437_system_0": "@prompts/webhook-reliability-architect_instructor-llmnode-437_system_0.md",
    "webhook_reliability_architect_instructor_llmnode_437_user_1": "@prompts/webhook-reliability-architect_instructor-llmnode-437_user_1.md"
  },
  "modelConfigs": {
    "webhook_reliability_architect_instructor_llmnode_437_generative_model_name": "@model-configs/webhook-reliability-architect_instructor-llmnode-437_generative-model-name.ts"
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
        "advance_schema": "{\n  \"scenario\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_437",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"analysis\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"executiveSummary\": {\n          \"type\": \"string\"\n        },\n        \"riskScore\": {\n          \"type\": \"number\"\n        },\n        \"riskLevel\": {\n          \"type\": \"string\",\n          \"enum\": [\n            \"low\",\n            \"moderate\",\n            \"high\",\n            \"critical\"\n          ]\n        },\n        \"assumptions\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"idempotencyPlan\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"keyStrategy\": {\n              \"type\": \"string\"\n            },\n            \"keyExample\": {\n              \"type\": \"string\"\n            },\n            \"storage\": {\n              \"type\": \"string\"\n            },\n            \"ttlHours\": {\n              \"type\": \"number\"\n            },\n            \"firstSeenBehavior\": {\n              \"type\": \"string\"\n            },\n            \"duplicateBehavior\": {\n              \"type\": \"string\"\n            },\n            \"conflictBehavior\": {\n              \"type\": \"string\"\n            }\n          },\n          \"required\": [\n            \"keyStrategy\",\n            \"keyExample\",\n            \"storage\",\n            \"ttlHours\",\n            \"firstSeenBehavior\",\n            \"duplicateBehavior\",\n            \"conflictBehavior\"\n          ],\n          \"additionalProperties\": true\n        },\n        \"retryPlan\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"policy\": {\n              \"type\": \"string\"\n            },\n            \"maxAttempts\": {\n              \"type\": \"number\"\n            },\n            \"maxDeliveryAgeMinutes\": {\n              \"type\": \"number\"\n            },\n            \"jitter\": {\n              \"type\": \"string\"\n            },\n            \"schedule\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"attempt\": {\n                    \"type\": \"number\"\n                  },\n                  \"delaySeconds\": {\n                    \"type\": \"number\"\n                  },\n                  \"purpose\": {\n                    \"type\": \"string\"\n                  }\n                },\n                \"required\": [\n                  \"attempt\",\n                  \"delaySeconds\",\n                  \"purpose\"\n                ],\n                \"additionalProperties\": true\n              }\n            },\n            \"retryableConditions\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"nonRetryableConditions\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"required\": [\n            \"policy\",\n            \"maxAttempts\",\n            \"maxDeliveryAgeMinutes\",\n            \"jitter\",\n            \"schedule\",\n            \"retryableConditions\",\n            \"nonRetryableConditions\"\n          ],\n          \"additionalProperties\": true\n        },\n        \"deadLetterPlan\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"trigger\": {\n              \"type\": \"string\"\n            },\n            \"record\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"replayChecklist\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"required\": [\n            \"trigger\",\n            \"record\",\n            \"replayChecklist\"\n          ],\n          \"additionalProperties\": true\n        },\n        \"observability\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"slo\": {\n              \"type\": \"string\"\n            },\n            \"metrics\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"alerts\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            },\n            \"logFields\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"string\"\n              }\n            }\n          },\n          \"required\": [\n            \"slo\",\n            \"metrics\",\n            \"alerts\",\n            \"logFields\"\n          ],\n          \"additionalProperties\": true\n        },\n        \"failureModes\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"scenario\": {\n                \"type\": \"string\"\n              },\n              \"impact\": {\n                \"type\": \"string\"\n              },\n              \"signal\": {\n                \"type\": \"string\"\n              },\n              \"mitigation\": {\n                \"type\": \"string\"\n              }\n            },\n            \"required\": [\n              \"scenario\",\n              \"impact\",\n              \"signal\",\n              \"mitigation\"\n            ],\n            \"additionalProperties\": true\n          }\n        },\n        \"testMatrix\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"name\": {\n                \"type\": \"string\"\n              },\n              \"setup\": {\n                \"type\": \"string\"\n              },\n              \"expected\": {\n                \"type\": \"string\"\n              }\n            },\n            \"required\": [\n              \"name\",\n              \"setup\",\n              \"expected\"\n            ],\n            \"additionalProperties\": true\n          }\n        },\n        \"rolloutSteps\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        }\n      },\n      \"required\": [\n        \"executiveSummary\",\n        \"riskScore\",\n        \"riskLevel\",\n        \"assumptions\",\n        \"idempotencyPlan\",\n        \"retryPlan\",\n        \"deadLetterPlan\",\n        \"observability\",\n        \"failureModes\",\n        \"testMatrix\",\n        \"rolloutSteps\"\n      ],\n      \"additionalProperties\": true\n    }\n  },\n  \"required\": [\n    \"analysis\"\n  ]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/webhook-reliability-architect_instructor-llmnode-437_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/webhook-reliability-architect_instructor-llmnode-437_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/webhook-reliability-architect_instructor-llmnode-437_generative-model-name.ts"
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
        "outputMapping": "{\n  \"analysis\": \"{{InstructorLLMNode_437.output.analysis}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_437",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_437",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_437-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_437",
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
