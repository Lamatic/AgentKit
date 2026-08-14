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
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          `{
            "anomalies": "[string]",
            "changeEvents": "[string]",
            "periodLabel": "string",
            "currency": "string"
          }`,
      },
    },
  },
  {
    id: "codeNode_redact",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "codeNode",
      values: {
        code: "@scripts/cost-attribution_redact.ts",
        nodeName: "Redact",
      },
    },
  },
  {
    id: "InstructorLLMNode_attribute",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: `{
          "type": "object",
          "properties": {
            "attributions": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "anomalyId": { "type": "string" },
                  "causeEventId": { "type": "string" },
                  "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"]
                  },
                  "evidence": {
                    "type": "array",
                    "items": { "type": "string" }
                  },
                  "reasoning": { "type": "string" },
                  "rejectedCandidates": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "eventId": { "type": "string" },
                        "whyNot": { "type": "string" }
                      },
                      "additionalProperties": true
                    }
                  }
                },
                "additionalProperties": true
              }
            }
          }
        }`,
        prompts: [
          { id: "cost-attribution-attribute-system", role: "system", content: "@prompts/cost-attribution_attribute_system.md" },
          { id: "cost-attribution-attribute-user", role: "user", content: "@prompts/cost-attribution_attribute_user.md" },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Attribute",
        attachments: "",
        generativeModelName: "@model-configs/cost-attribution_attribute_generative-model-name.ts",
      },
    },
  },
  {
    id: "InstructorLLMNode_remediate",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: `{
          "type": "object",
          "properties": {
            "remediations": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "anomalyId": { "type": "string" },
                  "action": { "type": "string" },
                  "rationale": { "type": "string" },
                  "effort": {
                    "type": "string",
                    "enum": ["low", "medium", "high"]
                  },
                  "risk": {
                    "type": "string",
                    "enum": ["low", "medium", "high"]
                  },
                  "prerequisites": {
                    "type": "array",
                    "items": { "type": "string" }
                  },
                  "savingsKey": {
                    "type": "string",
                    "enum": [
                      "eliminate-full",
                      "reduce-major",
                      "reduce-partial",
                      "reduce-minor",
                      "one-time-only",
                      "unknown"
                    ]
                  }
                },
                "additionalProperties": true
              }
            }
          }
        }`,
        prompts: [
          { id: "cost-attribution-remediate-system", role: "system", content: "@prompts/cost-attribution_remediate_system.md" },
          { id: "cost-attribution-remediate-user", role: "user", content: "@prompts/cost-attribution_remediate_user.md" },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Remediate",
        attachments: "",
        generativeModelName: "@model-configs/cost-attribution_remediate_generative-model-name.ts",
      },
    },
  },
  {
    id: "codeNode_assemble",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "codeNode",
      values: {
        code: "@scripts/cost-attribution_assemble.ts",
        nodeName: "Assemble",
      },
    },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        id: "responseNode_triggerNode_1",
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: `{
          "periodLabel": "{{codeNode_assemble.output.periodLabel}}",
          "currency": "{{codeNode_assemble.output.currency}}",
          "totalCurrent": "{{codeNode_assemble.output.totalCurrent}}",
          "totalBaseline": "{{codeNode_assemble.output.totalBaseline}}",
          "totalDeltaAbs": "{{codeNode_assemble.output.totalDeltaAbs}}",
          "totalDeltaPct": "{{codeNode_assemble.output.totalDeltaPct}}",
          "anomalies": "{{codeNode_assemble.output.anomalies}}",
          "totalEstimatedSavings": "{{codeNode_assemble.output.totalEstimatedSavings}}",
          "unattributedCount": "{{codeNode_assemble.output.unattributedCount}}",
          "execSummary": "{{codeNode_assemble.output.execSummary}}"
        }`,
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-codeNode_redact",
    source: "triggerNode_1",
    target: "codeNode_redact",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "codeNode_redact-InstructorLLMNode_attribute",
    source: "codeNode_redact",
    target: "InstructorLLMNode_attribute",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_attribute-InstructorLLMNode_remediate",
    source: "InstructorLLMNode_attribute",
    target: "InstructorLLMNode_remediate",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_remediate-codeNode_assemble",
    source: "InstructorLLMNode_remediate",
    target: "codeNode_assemble",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "codeNode_assemble-responseNode_triggerNode_1",
    source: "codeNode_assemble",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-trigger_triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
