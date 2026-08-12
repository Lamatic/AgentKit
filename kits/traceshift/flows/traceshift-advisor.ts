/*
 * # TraceShift Advisor
 *
 * Converts a deterministic, aggregate-only trace evidence pack into a focused
 * optimization proposal. The flow never parses raw CSV and never mutates a
 * deployed workflow. Metrics remain deterministic in the companion app; the
 * Instructor LLM is limited to explanation, risk framing, and validation steps.
 */

// Flow: traceshift-advisor

export const meta = {
  name: "TraceShift Advisor",
  description:
    "Turns deterministic production-trace evidence into a reviewable optimization proposal with risks, validation gates, and rollback criteria.",
  tags: ["observability", "optimization", "traces"],
  testInput: {
    evidencePack:
      '{"optimizationGoal":"Reduce latency without changing output behavior","candidateType":"exact-cache","nodeName":"Catalog Lookup","occurrences":18,"repeatRate":0.56,"outputStability":1,"measuredLatencySeconds":41.2,"measuredCost":0,"assumptions":["Exact input fingerprint only"]}',
  },
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/traceshift",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Bhavya Bafna",
    email: "bhavyabafnaa@users.noreply.github.com",
  },
};

export const inputs = {
  InstructorLLMNode_201: [
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
    traceshift_advisor_instructor_llmnode_201_system_0:
      "@prompts/traceshift-advisor_instructor-llmnode-201_system_0.md",
    traceshift_advisor_instructor_llmnode_201_user_1:
      "@prompts/traceshift-advisor_instructor-llmnode-201_user_1.md",
  },
  modelConfigs: {
    traceshift_advisor_instructor_llmnode_201_generative_model_name:
      "@model-configs/traceshift-advisor_instructor-llmnode-201_generative-model-name.ts",
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
          '{\n  "evidencePack": "string"\n}',
      },
    },
  },
  {
    id: "InstructorLLMNode_201",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "InstructorLLMNode",
      values: {
        tools: [],
        schema:
          '{\n  "type": "object",\n  "properties": {\n    "title": { "type": "string" },\n    "recommendation": { "type": "string" },\n    "rationale": { "type": "string" },\n    "evidence": { "type": "array", "items": { "type": "string" } },\n    "risks": { "type": "array", "items": { "type": "string" } },\n    "validationPlan": { "type": "array", "items": { "type": "string" } },\n    "rollbackCondition": { "type": "string" },\n    "confidence": { "type": "string", "enum": ["low", "medium", "high"] },\n    "approvalRequired": { "type": "boolean" }\n  },\n  "required": ["title", "recommendation", "rationale", "evidence", "risks", "validationPlan", "rollbackCondition", "confidence", "approvalRequired"],\n  "additionalProperties": false\n}',
        prompts: [
          {
            id: "3a9f9559-20dc-4c3f-9c8a-3a66b9106ee1",
            role: "system",
            content:
              "@prompts/traceshift-advisor_instructor-llmnode-201_system_0.md",
          },
          {
            id: "b4e1be2e-dad5-46fc-8ec3-00de6b9a5317",
            role: "user",
            content:
              "@prompts/traceshift-advisor_instructor-llmnode-201_user_1.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Evidence-grounded advisor",
        attachments: "",
        generativeModelName:
          "@model-configs/traceshift-advisor_instructor-llmnode-201_generative-model-name.ts",
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
        outputMapping:
          '{\n  "proposal": "{{InstructorLLMNode_201.output}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-InstructorLLMNode_201",
    source: "triggerNode_1",
    target: "InstructorLLMNode_201",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "InstructorLLMNode_201-responseNode_triggerNode_1",
    source: "InstructorLLMNode_201",
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
