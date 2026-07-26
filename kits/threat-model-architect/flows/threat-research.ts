export const meta = {
  name: "threat-research",
  description: "Enriches STRIDE threats with OWASP/CWE mapping and defensible validation research.",
  tags: ["security", "research", "owasp"],
  testInput: '{"architecture":"{}","stride_analysis":"{}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};

export const inputs = {
  InstructorLLMNode_160: [{
    name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for threat research.",
    modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" },
  }],
};
export const references = { prompts: { system: "@prompts/threat-research_system.md", user: "@prompts/threat-research_user.md" }, constitutions: { default: "@constitutions/default.md" } };
export const nodes = [
  { id: "triggerNode_1", data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "architecture": "string",\n  "stride_analysis": "string"\n}' }, trigger: true }, type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false },
  { id: "InstructorLLMNode_160", data: { label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode", values: {
    id: "InstructorLLMNode_160", tools: [], schema: JSON.stringify({ type: "object", properties: { research_findings: { type: "array", items: { type: "object", additionalProperties: true } }, research_summary: { type: "string" }, research_limitations: { type: "array", items: { type: "string" } } } }),
    prompts: [{ id: "research-system", role: "system", content: "@prompts/threat-research_system.md" }, { id: "research-user", role: "user", content: "@prompts/threat-research_user.md" }], memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
  } }, type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false },
  { id: "responseNode_triggerNode_1", data: { label: "Response", nodeId: "graphqlResponseNode", values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "research_findings": "${{InstructorLLMNode_160.output.research_findings}}",\n  "research_summary": "${{InstructorLLMNode_160.output.research_summary}}",\n  "research_limitations": "${{InstructorLLMNode_160.output.research_limitations}}"\n}' }, disabled: false, isResponseNode: true }, type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false },
];
export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_160", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_160", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_160-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_160", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];
export default { meta, inputs, references, nodes, edges };
