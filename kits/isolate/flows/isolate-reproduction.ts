// Exported from the deployed Lamatic Studio flow.

export const meta = {
  name: "Isolate Reproduction",
  description:
    "Plan a safe terminal reproduction probe from a normalized GitHub issue and repository snapshot.",
  tags: ["Developer Tools", "GitHub", "Reproduction"],
  testInput: null,
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/isolate",
  documentationUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/isolate/README.md",
  deployUrl: "https://studio.lamatic.ai",
  author: {
    name: "Dhruv Sharma",
    email: "dhruv.sharma10102005@gmail.com",
  },
};

export const inputs = {
  LLMNode_887: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
    },
  ],
};

export const references = {
  constitutions: { default: "@constitutions/default.md" },
  prompts: {
    isolate_reproduction_llmnode_887_system_0:
      "@prompts/isolate-reproduction-system.md",
    isolate_reproduction_llmnode_887_user_1:
      "@prompts/isolate-reproduction-user.md",
  },
  modelConfigs: {
    isolate_reproduction_llmnode_887_generative_model_name:
      "@model-configs/isolate-reproduction-model.ts",
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
          '{\n  "issue": "string",\n  "repositoryContext": "string",\n  "ref": "string"\n}',
      },
    },
  },
  {
    id: "LLMNode_887",
    type: "dynamicNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "LLMNode",
      values: {
        tools: [],
        prompts: [
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            role: "system",
            content: "@prompts/isolate-reproduction-system.md",
          },
          {
            id: "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            role: "user",
            content: "@prompts/isolate-reproduction-user.md",
          },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate Text",
        attachments: "",
        credentials: "",
        generativeModelName: "@model-configs/isolate-reproduction-model.ts",
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
          '{\n  "plan": "{{LLMNode_887.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_887",
    source: "triggerNode_1",
    target: "LLMNode_887",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_887-responseNode_triggerNode_1",
    source: "LLMNode_887",
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
