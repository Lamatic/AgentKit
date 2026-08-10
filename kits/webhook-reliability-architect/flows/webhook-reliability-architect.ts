// Flow: webhook-reliability-architect

// -- Meta --
export const meta = {
  name: "Webhook Reliability Architect",
  description: "",
  tags: [],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Amar Kumar",
    email: "amarkumar05092003@gmail.com",
  },
};

// -- Inputs --
export const inputs = {
  InstructorLLMNode_437: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
    },
  ],
};

// -- References --
export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    webhook_reliability_architect_instructor_llmnode_437_system_0:
      "@prompts/webhook-reliability-architect_instructor-llmnode-437_system_0.md",
    webhook_reliability_architect_instructor_llmnode_437_user_1:
      "@prompts/webhook-reliability-architect_instructor-llmnode-437_user_1.md",
  },
  modelConfigs: {
    webhook_reliability_architect_instructor_llmnode_437_generative_model_name:
      "@model-configs/webhook-reliability-architect_instructor-llmnode-437_generative-model-name.ts",
  },
};

const outputSchema = {
  type: "object",
  properties: {
    analysis: {
      type: "object",
      properties: {
        executiveSummary: { type: "string" },
        riskScore: { type: "number" },
        riskLevel: {
          type: "string",
          enum: ["low", "moderate", "high", "critical"],
        },
        assumptions: {
          type: "array",
          items: { type: "string" },
        },
        idempotencyPlan: {
          type: "object",
          properties: {
            keyStrategy: { type: "string" },
            keyExample: { type: "string" },
            storage: { type: "string" },
            ttlHours: { type: "number" },
            firstSeenBehavior: { type: "string" },
            duplicateBehavior: { type: "string" },
            conflictBehavior: { type: "string" },
          },
          required: [
            "keyStrategy",
            "keyExample",
            "storage",
            "ttlHours",
            "firstSeenBehavior",
            "duplicateBehavior",
            "conflictBehavior",
          ],
          additionalProperties: true,
        },
        retryPlan: {
          type: "object",
          properties: {
            policy: { type: "string" },
            maxAttempts: { type: "number" },
            maxDeliveryAgeMinutes: { type: "number" },
            jitter: { type: "string" },
            schedule: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  attempt: { type: "number" },
                  delaySeconds: { type: "number" },
                  purpose: { type: "string" },
                },
                required: ["attempt", "delaySeconds", "purpose"],
                additionalProperties: true,
              },
            },
            retryableConditions: {
              type: "array",
              items: { type: "string" },
            },
            nonRetryableConditions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: [
            "policy",
            "maxAttempts",
            "maxDeliveryAgeMinutes",
            "jitter",
            "schedule",
            "retryableConditions",
            "nonRetryableConditions",
          ],
          additionalProperties: true,
        },
        deadLetterPlan: {
          type: "object",
          properties: {
            trigger: { type: "string" },
            record: {
              type: "array",
              items: { type: "string" },
            },
            replayChecklist: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["trigger", "record", "replayChecklist"],
          additionalProperties: true,
        },
        observability: {
          type: "object",
          properties: {
            slo: { type: "string" },
            metrics: {
              type: "array",
              items: { type: "string" },
            },
            alerts: {
              type: "array",
              items: { type: "string" },
            },
            logFields: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["slo", "metrics", "alerts", "logFields"],
          additionalProperties: true,
        },
        failureModes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              scenario: { type: "string" },
              impact: { type: "string" },
              signal: { type: "string" },
              mitigation: { type: "string" },
            },
            required: ["scenario", "impact", "signal", "mitigation"],
            additionalProperties: true,
          },
        },
        testMatrix: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              setup: { type: "string" },
              expected: { type: "string" },
            },
            required: ["name", "setup", "expected"],
            additionalProperties: true,
          },
        },
        rolloutSteps: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: [
        "executiveSummary",
        "riskScore",
        "riskLevel",
        "assumptions",
        "idempotencyPlan",
        "retryPlan",
        "deadLetterPlan",
        "observability",
        "failureModes",
        "testMatrix",
        "rolloutSteps",
      ],
      additionalProperties: true,
    },
  },
  required: ["analysis"],
};

// -- Nodes & Edges --
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
        advance_schema: "{\n  \"scenario\": \"string\"\n}",
      },
    },
  },
  {
    id: "InstructorLLMNode_437",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema: JSON.stringify(outputSchema, null, 2),
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/webhook-reliability-architect_instructor-llmnode-437_system_0.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/webhook-reliability-architect_instructor-llmnode-437_user_1.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate JSON",
        attachments: "",
        generativeModelName:
          "@model-configs/webhook-reliability-architect_instructor-llmnode-437_generative-model-name.ts",
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
        headers: "{\"content-type\":\"application/json\"}",
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: "{\n  \"analysis\": \"{{InstructorLLMNode_437.output.analysis}}\"\n}",
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_437",
    source: "triggerNode_1",
    target: "InstructorLLMNode_437",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_437-responseNode_triggerNode_1",
    source: "InstructorLLMNode_437",
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
