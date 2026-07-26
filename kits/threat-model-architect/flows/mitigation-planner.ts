export const meta = {
  name: "mitigation-planner", description: "Creates a traceable 7/30/60/90-day security remediation roadmap.",
  tags: ["security", "mitigation", "owasp"], testInput: '{"architecture":"{}","ranked_threats":"{}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect", documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};
export const inputs = { InstructorLLMNode_162: [{ name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for remediation planning.", modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" } }] };
export const references = { prompts: { system: "@prompts/mitigation-planner_system.md", user: "@prompts/mitigation-planner_user.md" }, constitutions: { default: "@constitutions/default.md" } };
export const nodes = [
  { id: "triggerNode_1", data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "architecture": "string",\n  "ranked_threats": "string"\n}' }, trigger: true }, type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false },
  { id: "InstructorLLMNode_162", data: { label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode", values: {
    id: "InstructorLLMNode_162", tools: [], schema: JSON.stringify({ type: "object", properties: { report_title: { type: "string" }, executive_summary: { type: "string" }, immediate_actions: { type: "array", items: { type: "object", additionalProperties: true } }, days_30: { type: "array", items: { type: "object", additionalProperties: true } }, days_60: { type: "array", items: { type: "object", additionalProperties: true } }, days_90: { type: "array", items: { type: "object", additionalProperties: true } }, threat_mitigations: { type: "array", items: { type: "object", additionalProperties: true } } } }),
    prompts: [{ id: "mitigation-system", role: "system", content: "@prompts/mitigation-planner_system.md" }, { id: "mitigation-user", role: "user", content: "@prompts/mitigation-planner_user.md" }], memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
  } }, type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false },
  { id: "responseNode_triggerNode_1", data: { label: "Response", nodeId: "graphqlResponseNode", values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "report_title": "${{InstructorLLMNode_162.output.report_title}}",\n  "executive_summary": "${{InstructorLLMNode_162.output.executive_summary}}",\n  "immediate_actions": "${{InstructorLLMNode_162.output.immediate_actions}}",\n  "days_30": "${{InstructorLLMNode_162.output.days_30}}",\n  "days_60": "${{InstructorLLMNode_162.output.days_60}}",\n  "days_90": "${{InstructorLLMNode_162.output.days_90}}",\n  "threat_mitigations": "${{InstructorLLMNode_162.output.threat_mitigations}}"\n}' }, disabled: false, isResponseNode: true }, type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false },
];
export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_162", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_162", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_162-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_162", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];
export default { meta, inputs, references, nodes, edges };
