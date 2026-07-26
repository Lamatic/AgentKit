export const meta = {
  name: "stride-analyze",
  description: "Produces stack-specific STRIDE threats from a normalized architecture model.",
  tags: ["security", "stride", "threat-modeling"],
  testInput: '{"architecture":"{}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "",
  deployUrl: "",
  author: { name: "Kushagra Tiwari" },
};

export const inputs = {
  InstructorLLMNode_159: [{
    name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor",
    description: "Select a text model for STRIDE analysis.", modelType: "generator/text", required: true, isPrivate: true,
    defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }],
    typeOptions: { loadOptionsMethod: "listModels" },
  }],
};

export const references = {
  prompts: { system: "@prompts/stride-analyze_system.md", user: "@prompts/stride-analyze_user.md" },
  constitutions: { default: "@constitutions/default.md" },
};

export const nodes = [
  {
    id: "triggerNode_1",
    data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "architecture": "string"\n}' }, trigger: true },
    type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false,
  },
  {
    id: "InstructorLLMNode_159",
    data: {
      label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode",
      values: {
        id: "InstructorLLMNode_159", tools: [],
        schema: JSON.stringify({ type: "object", properties: {
          system_name: { type: "string" }, summary: { type: "string" },
          threats: { type: "array", items: { type: "object", additionalProperties: true } },
          coverage: { type: "object", additionalProperties: true },
          missing_info: { type: "array", items: { type: "string" } },
        }, required: ["system_name", "summary", "threats", "coverage", "missing_info"] }),
        prompts: [{ id: "stride-system", role: "system", content: "@prompts/stride-analyze_system.md" }, { id: "stride-user", role: "user", content: "@prompts/stride-analyze_user.md" }],
        memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
      },
    },
    type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false,
  },
  {
    id: "responseNode_triggerNode_1",
    data: {
      label: "Response", nodeId: "graphqlResponseNode",
      values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "system_name": "${{InstructorLLMNode_159.output.system_name}}",\n  "summary": "${{InstructorLLMNode_159.output.summary}}",\n  "threats": "${{InstructorLLMNode_159.output.threats}}",\n  "coverage": "${{InstructorLLMNode_159.output.coverage}}",\n  "missing_info": "${{InstructorLLMNode_159.output.missing_info}}"\n}' },
      disabled: false, isResponseNode: true,
    },
    type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false,
  },
];

export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_159", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_159", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_159-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_159", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];

export default { meta, inputs, references, nodes, edges };
