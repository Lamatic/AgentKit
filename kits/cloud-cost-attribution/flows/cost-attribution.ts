// Flow: cost-attribution

export const meta = {
  name: "cost-attribution",
  description:
    "Attributes cloud spend anomalies to the specific deploy/config/infra change that caused them, and returns a costed remediation plan.",
  tags: ["finops", "cloud-cost", "attribution"],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: { name: "", email: "" },
};

export const inputs = {
  InstructorLLMNode_attribute: [
    { name: "generativeModelName", label: "Generative Model Name", type: "model" },
  ],
  InstructorLLMNode_remediate: [
    { name: "generativeModelName", label: "Generative Model Name", type: "model" },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    cost_attribution_attribute_system: "@prompts/cost-attribution_attribute_system.md",
    cost_attribution_attribute_user: "@prompts/cost-attribution_attribute_user.md",
    cost_attribution_remediate_system: "@prompts/cost-attribution_remediate_system.md",
    cost_attribution_remediate_user: "@prompts/cost-attribution_remediate_user.md",
  },
  modelConfigs: {
    cost_attribution_attribute_generative_model_name: "@model-configs/cost-attribution_attribute_generative-model-name.ts",
    cost_attribution_remediate_generative_model_name: "@model-configs/cost-attribution_remediate_generative-model-name.ts",
  },
  scripts: {
    cost_attribution_redact_code: "@scripts/cost-attribution_redact.ts",
    cost_attribution_assemble_code: "@scripts/cost-attribution_assemble.ts",
  },
};

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
        "advance_schema": "{\n            \"anomalies\": \"[string]\",\n            \"changeEvents\": \"[string]\",\n            \"periodLabel\": \"string\",\n            \"currency\": \"string\"\n          }"
      }
    }
  },
  {
    "id": "codeNode_redact",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_redact",
        "code": "@scripts/cost-attribution_redact.ts",
        "nodeName": "Redact"
      }
    }
  },
  {
    "id": "InstructorLLMNode_attribute",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_attribute",
        "schema": "{\n          \"type\": \"object\",\n          \"properties\": {\n            \"attributions\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"anomalyId\": { \"type\": \"string\" },\n                  \"causeEventId\": { \"type\": \"string\" },\n                  \"confidence\": {\n                    \"type\": \"string\",\n                    \"enum\": [\"high\", \"medium\", \"low\"]\n                  },\n                  \"evidence\": {\n                    \"type\": \"array\",\n                    \"items\": { \"type\": \"string\" }\n                  },\n                  \"reasoning\": { \"type\": \"string\" },\n                  \"rejectedCandidates\": {\n                    \"type\": \"array\",\n                    \"items\": {\n                      \"type\": \"object\",\n                      \"properties\": {\n                        \"eventId\": { \"type\": \"string\" },\n                        \"whyNot\": { \"type\": \"string\" }\n                      },\n                      \"additionalProperties\": true\n                    }\n                  }\n                },\n                \"additionalProperties\": true\n              }\n            }\n          }\n        }",
        "prompts": [
          {
            "id": "cost-attribution-attribute-system",
            "role": "system",
            "content": "@prompts/cost-attribution_attribute_system.md"
          },
          {
            "id": "cost-attribution-attribute-user",
            "role": "user",
            "content": "@prompts/cost-attribution_attribute_user.md"
          }
        ],
        "memories": "[]",
        "nodeName": "Attribute",
        "generativeModelName": "@model-configs/cost-attribution_attribute_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_remediate",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_remediate",
        "schema": "{\n          \"type\": \"object\",\n          \"properties\": {\n            \"remediations\": {\n              \"type\": \"array\",\n              \"items\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"anomalyId\": { \"type\": \"string\" },\n                  \"action\": { \"type\": \"string\" },\n                  \"rationale\": { \"type\": \"string\" },\n                  \"effort\": {\n                    \"type\": \"string\",\n                    \"enum\": [\"low\", \"medium\", \"high\"]\n                  },\n                  \"risk\": {\n                    \"type\": \"string\",\n                    \"enum\": [\"low\", \"medium\", \"high\"]\n                  },\n                  \"prerequisites\": {\n                    \"type\": \"array\",\n                    \"items\": { \"type\": \"string\" }\n                  },\n                  \"savingsKey\": {\n                    \"type\": \"string\",\n                    \"enum\": [\n                      \"eliminate-full\",\n                      \"reduce-major\",\n                      \"reduce-partial\",\n                      \"reduce-minor\",\n                      \"one-time-only\",\n                      \"unknown\"\n                    ]\n                  }\n                },\n                \"additionalProperties\": true\n              }\n            }\n          }\n        }",
        "prompts": [
          {
            "id": "cost-attribution-remediate-system",
            "role": "system",
            "content": "@prompts/cost-attribution_remediate_system.md"
          },
          {
            "id": "cost-attribution-remediate-user",
            "role": "user",
            "content": "@prompts/cost-attribution_remediate_user.md"
          }
        ],
        "nodeName": "Remediate",
        "generativeModelName": "@model-configs/cost-attribution_remediate_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_assemble",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_assemble",
        "code": "@scripts/cost-attribution_assemble.ts",
        "nodeName": "Assemble"
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
        "nodeName": "",
        "outputMapping": "{\n          \"periodLabel\": \"{{codeNode_assemble.output.periodLabel}}\",\n          \"currency\": \"{{codeNode_assemble.output.currency}}\",\n          \"totalCurrent\": \"{{codeNode_assemble.output.totalCurrent}}\",\n          \"totalBaseline\": \"{{codeNode_assemble.output.totalBaseline}}\",\n          \"totalDeltaAbs\": \"{{codeNode_assemble.output.totalDeltaAbs}}\",\n          \"totalDeltaPct\": \"{{codeNode_assemble.output.totalDeltaPct}}\",\n          \"anomalies\": \"{{codeNode_assemble.output.anomalies}}\",\n          \"totalEstimatedSavings\": \"{{codeNode_assemble.output.totalEstimatedSavings}}\",\n          \"unattributedCount\": \"{{codeNode_assemble.output.unattributedCount}}\",\n          \"execSummary\": \"{{codeNode_assemble.output.execSummary}}\"\n        }"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_redact",
    "source": "triggerNode_1",
    "target": "codeNode_redact",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_redact-InstructorLLMNode_attribute",
    "source": "codeNode_redact",
    "target": "InstructorLLMNode_attribute",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_attribute-InstructorLLMNode_remediate",
    "source": "InstructorLLMNode_attribute",
    "target": "InstructorLLMNode_remediate",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_remediate-codeNode_assemble",
    "source": "InstructorLLMNode_remediate",
    "target": "codeNode_assemble",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_assemble-responseNode_triggerNode_1",
    "source": "codeNode_assemble",
    "target": "responseNode_triggerNode_1",
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
