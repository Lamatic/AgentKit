// Flow: flow-launch-auditor

// -- Meta --
export const meta = {
  "name": "flow-launch-auditor",
  "description": "Evidence-backed go-live readiness review for one Lamatic Flow.",
  "tags": ["launch-readiness", "evals", "observability"],
  "testInput": {
    "flowBrief": "A customer support team wants a Lamatic Flow that classifies inbound billing emails before they reach the human support queue. The Flow is triggered by a helpdesk webhook, calls a read-only billing-status API with BILLING_API_KEY, and returns category, confidence, reason, suggestedQueue, and billingStatus. If the API times out, it classifies from the email text and sets billingStatus to unknown. The team has five fixtures and one malformed-input test. Logs include ticket ID, category, confidence, and API success, but not full email bodies.",
    "optionalFlowExport": "flow: billing-email-classifier\ntrigger: helpdesk-webhook\nsteps:\n  - model: classify billing ticket\n  - tool: billing-status-api, read-only, timeout fallback sets billingStatus=unknown",
    "detectedSignals": {
      "hasEnoughContext": true,
      "envLikeTokens": ["BILLING_API_KEY"],
      "categorySignals": {
        "evals-and-tests": ["five fixtures", "malformed-input test"],
        "tool-boundaries": ["helpdesk webhook", "read-only billing-status API"],
        "failure-paths": ["API times out", "billingStatus unknown"],
        "security-and-privacy": ["logs omit full email bodies"],
        "env-and-setup-docs": ["README"],
        "observability-and-logging": ["ticket ID", "category", "confidence"],
        "cost-and-latency": []
      }
    }
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/flow-launch-auditor",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/flow-launch-auditor#readme",
  "deployUrl": "",
  "author": {
    "name": "Lucero del Alba",
    "email": "luzdealba@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_524": [
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
    "flow_launch_auditor_instructor_llmnode_524_system_0": "@prompts/flow-launch-auditor_instructor-llmnode-524_system_0.md",
    "flow_launch_auditor_instructor_llmnode_524_user_1": "@prompts/flow-launch-auditor_instructor-llmnode-524_user_1.md"
  },
  "modelConfigs": {
    "flow_launch_auditor_instructor_llmnode_524_generative_model_name": "@model-configs/flow-launch-auditor_instructor-llmnode-524_generative-model-name.ts"
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
        "responseType": "realtime",
        "advance_schema": "{\n  \"flowBrief\": \"string\",\n  \"optionalFlowExport\": \"string\",\n  \"detectedSignals\": \"object\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_524",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"additionalProperties\": false,\n  \"required\": [\n    \"launchDecision\",\n    \"confidence\",\n    \"summary\",\n    \"detectedSignals\",\n    \"topRisks\",\n    \"findings\",\n    \"recommendedFixes\",\n    \"questionsToContinue\"\n  ],\n  \"properties\": {\n    \"launchDecision\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"ready\",\n        \"needs-review\",\n        \"not-ready\",\n        \"not-enough-context\"\n      ]\n    },\n    \"confidence\": {\n      \"type\": \"string\",\n      \"enum\": [\n        \"high\",\n        \"medium\"\n      ]\n    },\n    \"summary\": {\n      \"type\": \"string\",\n      \"minLength\": 20,\n      \"maxLength\": 500\n    },\n    \"detectedSignals\": {\n      \"type\": \"object\",\n      \"additionalProperties\": false,\n      \"required\": [\n        \"hasEnoughContext\",\n        \"envLikeTokens\",\n        \"categorySignals\"\n      ],\n      \"properties\": {\n        \"hasEnoughContext\": {\n          \"type\": \"boolean\"\n        },\n        \"envLikeTokens\": {\n          \"type\": \"array\",\n          \"maxItems\": 50,\n          \"items\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 160,\n            \"pattern\": \"^[A-Z][A-Z0-9_]*$\"\n          }\n        },\n        \"categorySignals\": {\n          \"type\": \"object\",\n          \"additionalProperties\": false,\n          \"required\": [\n            \"evals-and-tests\",\n            \"tool-boundaries\",\n            \"failure-paths\",\n            \"security-and-privacy\",\n            \"env-and-setup-docs\",\n            \"observability-and-logging\",\n            \"cost-and-latency\"\n          ],\n          \"properties\": {\n            \"evals-and-tests\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"tool-boundaries\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"failure-paths\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"security-and-privacy\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"env-and-setup-docs\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"observability-and-logging\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            },\n            \"cost-and-latency\": {\n              \"type\": \"array\",\n              \"maxItems\": 50,\n              \"items\": {\n                \"type\": \"string\",\n                \"minLength\": 1,\n                \"maxLength\": 160\n              }\n            }\n          }\n        }\n      }\n    },\n    \"topRisks\": {\n      \"type\": \"array\",\n      \"maxItems\": 3,\n      \"items\": {\n        \"type\": \"string\",\n        \"minLength\": 1,\n        \"maxLength\": 160\n      }\n    },\n    \"findings\": {\n      \"type\": \"array\",\n      \"maxItems\": 5,\n      \"items\": {\n        \"type\": \"object\",\n        \"additionalProperties\": false,\n        \"required\": [\n          \"category\",\n          \"severity\",\n          \"title\",\n          \"evidence\",\n          \"whyItMatters\",\n          \"recommendedFix\"\n        ],\n        \"properties\": {\n          \"category\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"evals-and-tests\",\n              \"tool-boundaries\",\n              \"failure-paths\",\n              \"security-and-privacy\",\n              \"env-and-setup-docs\",\n              \"observability-and-logging\",\n              \"cost-and-latency\"\n            ]\n          },\n          \"severity\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"critical\",\n              \"high\",\n              \"medium\",\n              \"low\"\n            ]\n          },\n          \"title\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 120\n          },\n          \"evidence\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 360\n          },\n          \"whyItMatters\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 360\n          },\n          \"recommendedFix\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 300\n          }\n        }\n      }\n    },\n    \"recommendedFixes\": {\n      \"type\": \"array\",\n      \"maxItems\": 5,\n      \"items\": {\n        \"type\": \"object\",\n        \"additionalProperties\": false,\n        \"required\": [\n          \"priority\",\n          \"fix\",\n          \"estimatedEffort\",\n          \"launchImpact\"\n        ],\n        \"properties\": {\n          \"priority\": {\n            \"type\": \"integer\",\n            \"minimum\": 1,\n            \"maximum\": 5\n          },\n          \"fix\": {\n            \"type\": \"string\",\n            \"minLength\": 1,\n            \"maxLength\": 220\n          },\n          \"estimatedEffort\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"small\",\n              \"medium\",\n              \"large\"\n            ]\n          },\n          \"launchImpact\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"high\",\n              \"medium\",\n              \"low\"\n            ]\n          }\n        }\n      }\n    },\n    \"questionsToContinue\": {\n      \"type\": \"array\",\n      \"maxItems\": 4,\n      \"items\": {\n        \"type\": \"string\",\n        \"minLength\": 1,\n        \"maxLength\": 180\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/flow-launch-auditor_instructor-llmnode-524_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/flow-launch-auditor_instructor-llmnode-524_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/flow-launch-auditor_instructor-llmnode-524_generative-model-name.ts"
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
        "outputMapping": "{\n  \"launchDecision\": \"${{InstructorLLMNode_524.output.launchDecision}}\",\n  \"confidence\": \"${{InstructorLLMNode_524.output.confidence}}\",\n  \"summary\": \"${{InstructorLLMNode_524.output.summary}}\",\n  \"detectedSignals\": ${{InstructorLLMNode_524.output.detectedSignals}},\n  \"topRisks\": ${{InstructorLLMNode_524.output.topRisks}},\n  \"findings\": ${{InstructorLLMNode_524.output.findings}},\n  \"recommendedFixes\": ${{InstructorLLMNode_524.output.recommendedFixes}},\n  \"questionsToContinue\": ${{InstructorLLMNode_524.output.questionsToContinue}}\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_524",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_524",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_524-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_524",
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
