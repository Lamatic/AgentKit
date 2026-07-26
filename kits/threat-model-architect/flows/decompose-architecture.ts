export const meta = {
  name: "decompose-architecture",
  description:
    "Normalizes captured system context into components, actors, trust boundaries, entry points, and data flows.",
  tags: ["security", "architecture", "threat-modeling"],
  testInput: '{"session_state":"{}"}',
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "",
  deployUrl: "",
  author: { name: "Kushagra Tiwari" },
};

export const inputs = {
  InstructorLLMNode_158: [
    {
      name: "generativeModelName",
      label: "Generative Model Name",
      type: "model",
      mode: "instructor",
      description: "Select a text model for architecture normalization.",
      modelType: "generator/text",
      required: true,
      isPrivate: true,
      defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }],
      typeOptions: { loadOptionsMethod: "listModels" },
    },
  ],
};

export const references = {
  prompts: {
    system: "@prompts/decompose-architecture_system.md",
    user: "@prompts/decompose-architecture_user.md",
  },
  constitutions: { default: "@constitutions/default.md" },
};

export const nodes = [
  {
    id: "triggerNode_1",
    data: {
      modes: {},
      nodeId: "graphqlNode",
      values: {
        id: "triggerNode_1",
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: '{\n  "session_state": "string"\n}',
      },
      trigger: true,
    },
    type: "triggerNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 0 },
    selected: false,
  },
  {
    id: "InstructorLLMNode_158",
    data: {
      label: "dynamicNode node",
      modes: {},
      nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_158",
        tools: [],
        schema: JSON.stringify({
          type: "object",
          properties: {
            system_name: { type: "string" },
            purpose: { type: "string" },
            components: { type: "array", minItems: 1, items: { type: "object", additionalProperties: true } },
            external_actors: { type: "array", minItems: 1, items: { type: "object", additionalProperties: true } },
            data_assets: { type: "array", minItems: 1, items: { type: "object", additionalProperties: true } },
            trust_boundaries: { type: "array", minItems: 3, items: { type: "object", additionalProperties: true } },
            data_flows: { type: "array", minItems: 3, items: { type: "object", additionalProperties: true } },
            entry_points: { type: "array", minItems: 1, items: { type: "object", additionalProperties: true } },
            security_assumptions: { type: "array", minItems: 1, items: { type: "string" } },
            missing_info: { type: "array", items: { type: "string" } },
          },
          required: ["system_name", "purpose", "components", "external_actors", "data_assets", "trust_boundaries", "data_flows", "entry_points", "security_assumptions", "missing_info"],
        }),
        prompts: [
          { id: "decompose-system", role: "system", content: "@prompts/decompose-architecture_system.md" },
          { id: "decompose-user", role: "user", content: "@prompts/decompose-architecture_user.md" },
        ],
        memories: "[]",
        messages: "[]",
        nodeName: "Generate JSON",
        attachments: "",
        generativeModelName: "",
      },
    },
    type: "dynamicNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 130 },
    selected: false,
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response",
      nodeId: "graphqlResponseNode",
      values: {
        headers: '{"content-type":"application/json"}',
        retries: "0",
        nodeName: "API Response",
        webhookUrl: "",
        retry_delay: "0",
        outputMapping: '{\n  "system_name": "${{InstructorLLMNode_158.output.system_name}}",\n  "purpose": "${{InstructorLLMNode_158.output.purpose}}",\n  "components": "${{InstructorLLMNode_158.output.components}}",\n  "external_actors": "${{InstructorLLMNode_158.output.external_actors}}",\n  "data_assets": "${{InstructorLLMNode_158.output.data_assets}}",\n  "trust_boundaries": "${{InstructorLLMNode_158.output.trust_boundaries}}",\n  "data_flows": "${{InstructorLLMNode_158.output.data_flows}}",\n  "entry_points": "${{InstructorLLMNode_158.output.entry_points}}",\n  "security_assumptions": "${{InstructorLLMNode_158.output.security_assumptions}}",\n  "missing_info": "${{InstructorLLMNode_158.output.missing_info}}"\n}',
      },
      disabled: false,
      isResponseNode: true,
    },
    type: "responseNode",
    measured: { width: 216, height: 93 },
    position: { x: 0, y: 260 },
    selected: false,
  },
];

export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_158", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_158", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_158-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_158", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];

export default { meta, inputs, references, nodes, edges };
