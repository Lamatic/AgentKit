/*
 * # Accessibility Audit
 *
 * Receives sanitized webpage evidence through a synchronous API trigger and uses
 * structured generation to return evidence-backed WCAG 2.2 findings, remediation
 * guidance, and manual verification steps. The flow does not fetch URLs itself;
 * the companion Next.js app validates and retrieves public pages before invocation.
 */

// Flow: accessibility-audit

// -- Meta --
export const meta = {
  "name": "AccessFix Accessibility Audit",
  "description": "Converts webpage evidence into structured accessibility findings and remediation guidance.",
  "tags": ["accessibility", "wcag", "remediation"],
  "testInput": {
    "url": "https://example.com/sign-in",
    "pageContent": "<main><h1>Sign in</h1><input type=\"email\"><button><svg aria-hidden=\"true\"></svg></button></main>",
    "framework": "nextjs",
    "targetLevel": "AA"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aman Anurag",
    "email": "amananurag.20@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_284": [
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
    "accessibility_audit_instructor_llmnode_284_system_0": "@prompts/accessibility-audit_instructor-llmnode-284_system_0.md",
    "accessibility_audit_instructor_llmnode_284_user_1": "@prompts/accessibility-audit_instructor-llmnode-284_user_1.md"
  },
  "modelConfigs": {
    "accessibility_audit_instructor_llmnode_284_generative_model_name": "@model-configs/accessibility-audit_instructor-llmnode-284_generative-model-name.ts"
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
        "advance_schema": "{\n  \"url\": \"string\",\n  \"pageContent\": \"string\",\n  \"framework\": \"string\",\n  \"targetLevel\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_284",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"auditSummary\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"pageTitle\": {\n          \"type\": \"string\"\n        },\n        \"url\": {\n          \"type\": \"string\"\n        },\n        \"targetLevel\": {\n          \"type\": \"string\"\n        },\n        \"overallRisk\": {\n          \"type\": \"string\"\n        },\n        \"executiveSummary\": {\n          \"type\": \"string\"\n        },\n        \"totalFindings\": {\n          \"type\": \"number\"\n        },\n        \"criticalCount\": {\n          \"type\": \"number\"\n        },\n        \"seriousCount\": {\n          \"type\": \"number\"\n        },\n        \"moderateCount\": {\n          \"type\": \"number\"\n        },\n        \"minorCount\": {\n          \"type\": \"number\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"findings\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"severity\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          },\n          \"wcagCriterion\": {\n            \"type\": \"string\"\n          },\n          \"wcagLevel\": {\n            \"type\": \"string\"\n          },\n          \"wcagPrinciple\": {\n            \"type\": \"string\"\n          },\n          \"affectedUsers\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"selector\": {\n            \"type\": \"string\"\n          },\n          \"evidence\": {\n            \"type\": \"string\"\n          },\n          \"userImpact\": {\n            \"type\": \"string\"\n          },\n          \"recommendation\": {\n            \"type\": \"string\"\n          },\n          \"codeBefore\": {\n            \"type\": \"string\"\n          },\n          \"codeAfter\": {\n            \"type\": \"string\"\n          },\n          \"manualVerification\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"manualChecks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          },\n          \"steps\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"quickWins\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"limitations\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"disclaimer\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/accessibility-audit_instructor-llmnode-284_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/accessibility-audit_instructor-llmnode-284_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/accessibility-audit_instructor-llmnode-284_generative-model-name.ts"
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
        "outputMapping": "{\n  \"auditSummary\": \"{{InstructorLLMNode_284.output.auditSummary}}\",\n  \"findings\": \"{{InstructorLLMNode_284.output.findings}}\",\n  \"manualChecks\": \"{{InstructorLLMNode_284.output.manualChecks}}\",\n  \"quickWins\": \"{{InstructorLLMNode_284.output.quickWins}}\",\n  \"limitations\": \"{{InstructorLLMNode_284.output.limitations}}\",\n  \"disclaimer\": \"{{InstructorLLMNode_284.output.disclaimer}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_284",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_284",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_284-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_284",
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
