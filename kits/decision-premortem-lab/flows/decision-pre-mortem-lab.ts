// Flow: decision-pre-mortem-lab

export const meta = {
  name: "Decision Pre-Mortem Lab",
  description:
    "Expose fragile assumptions, failure modes, and validation experiments before committing resources.",
  tags: ["decision-making", "risk", "validation"],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Reuben Philipose",
    email: "reubenphilipose25@gmail.com",
  },
};

export const inputs = {
  InstructorLLMNode_199: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
    },
  ],
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    decision_pre_mortem_lab_instructor_llmnode_199_system_0:
      "@prompts/decision-pre-mortem-lab_instructor-llmnode-199_system_0.md",
    decision_pre_mortem_lab_instructor_llmnode_199_user_1:
      "@prompts/decision-pre-mortem-lab_instructor-llmnode-199_user_1.md",
  },
  modelConfigs: {
    decision_pre_mortem_lab_instructor_llmnode_199_generative_model_name:
      "@model-configs/decision-pre-mortem-lab_instructor-llmnode-199_generative-model-name.ts",
  },
};

const outputSchema = {
  type: "object",
  properties: {
    decisionSummary: { type: "string" },
    assumptions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          assumption: { type: "string" },
          evidenceStatus: {
            type: "string",
            enum: ["supported", "uncertain", "unsupported"],
          },
          rationale: { type: "string" },
          fastestTest: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    failureModes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          failureMode: { type: "string" },
          likelihood: { type: "string", enum: ["low", "medium", "high"] },
          impact: { type: "string", enum: ["low", "medium", "high"] },
          warningSignals: { type: "array", items: { type: "string" } },
          mitigation: { type: "string" },
          ownerRole: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    experiments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hypothesis: { type: "string" },
          method: { type: "string" },
          successMetric: { type: "string" },
          stopCondition: { type: "string" },
          estimatedEffort: { type: "string" },
          timebox: { type: "string" },
        },
        additionalProperties: true,
      },
    },
    recommendation: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["proceed", "pilot", "revise", "stop"],
        },
        rationale: { type: "string" },
        confidence: { type: "string", enum: ["low", "medium", "high"] },
      },
      additionalProperties: true,
    },
    nextActions: { type: "array", items: { type: "string" } },
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
        advance_schema: JSON.stringify(
          {
            decision: "string",
            context: "string",
            constraints: "string",
            timeHorizon: "string",
          },
          null,
          2,
        ),
      },
    },
  },
  {
    id: "InstructorLLMNode_199",
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
            content:
              "@prompts/decision-pre-mortem-lab_instructor-llmnode-199_system_0.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content:
              "@prompts/decision-pre-mortem-lab_instructor-llmnode-199_user_1.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate JSON",
        attachments: "",
        generativeModelName:
          "@model-configs/decision-pre-mortem-lab_instructor-llmnode-199_generative-model-name.ts",
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
        outputMapping: JSON.stringify(
          {
            decisionSummary:
              "${{InstructorLLMNode_199.output.decisionSummary}}",
            assumptions: "${{InstructorLLMNode_199.output.assumptions}}",
            failureModes: "${{InstructorLLMNode_199.output.failureModes}}",
            experiments: "${{InstructorLLMNode_199.output.experiments}}",
            recommendation: "${{InstructorLLMNode_199.output.recommendation}}",
            nextActions: "${{InstructorLLMNode_199.output.nextActions}}",
          },
          null,
          2,
        ),
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_199",
    source: "triggerNode_1",
    target: "InstructorLLMNode_199",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_199-responseNode_triggerNode_1",
    source: "InstructorLLMNode_199",
    target: "responseNode_triggerNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-trigger-triggerNode_1",
    source: "triggerNode_1",
    target: "responseNode_triggerNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
