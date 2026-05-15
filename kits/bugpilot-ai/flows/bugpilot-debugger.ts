// Flow: bugpilot-debugger

// -- Meta --
export const meta = {
  name: "bugpilot-debugger",
  description: "",
  tags: [],
  testInput: null,
  githubUrl: "",
  documentationUrl: "",
  deployUrl: "",
  author: {
    name: "Aman Kumar",
    email: "amankrit61@gmail.com",
  },
};

// -- Inputs --
export const inputs = {
  LLMNode_801: [
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
    bugpilot_debugger_llmnode_system:
      "@prompts/bugpilot-debugger_llmnode_system.md",
    bugpilot_debugger_llmnode_user:
      "@prompts/bugpilot-debugger_llmnode_user.md",
  },
  modelConfigs: {
    bugpilot_debugger_llmnode_generative_model:
      "@model-configs/bugpilot-debugger_llmnode_generative-model.ts",
  },
};

// -- Nodes & Edges --
export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema:
          '{\n  "language": "string",\n  "error": "string",\n  "codeSnippet": "string"\n}',
      },
    },
  },
  {
    id: "LLMNode_801",
    type: "dynamicNode",
    position: {
      x: 0,
      y: 0,
    },
    data: {
      nodeId: "LLMNode",
      values: {
        id: "LLMNode_801",
        tools: [],
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/bugpilot-debugger_llmnode_system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/bugpilot-debugger_llmnode_user.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate Text",
        attachments: "",
        credentials: "",
        generativeModelName:
          "@model-configs/bugpilot-debugger_llmnode_generative-model.ts",
      },
    },
  },
  {
    id: "responseNode_triggerNode_1",
    type: "responseNode",
    position: {
      x: 0,
      y: 0,
    },
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
          '{\n  "result": "{{LLMNode_801.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_801",
    source: "triggerNode_1",
    target: "LLMNode_801",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_801-responseNode_triggerNode_1",
    source: "LLMNode_801",
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
