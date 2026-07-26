export const meta = {
  name: "dread-prioritize",
  description: "Scores researched threats using DREAD and returns a ranked risk register.",
  tags: ["security", "dread", "risk"],
  testInput: '{"stride_analysis":"{}","research_findings":"{}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};
export const inputs = { InstructorLLMNode_161: [{
  name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for DREAD scoring.",
  modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" },
}] };
export const references = { prompts: { system: "@prompts/dread-prioritize_system.md", user: "@prompts/dread-prioritize_user.md" }, constitutions: { default: "@constitutions/default.md" } };
export const nodes = [
  { id: "triggerNode_1", data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "stride_analysis": "string",\n  "research_findings": "string"\n}' }, trigger: true }, type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false },
  { id: "InstructorLLMNode_161", data: { label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode", values: {
    id: "InstructorLLMNode_161", tools: [], schema: JSON.stringify({ type: "object", properties: { executive_risk_summary: { type: "string" }, ranked_threats: { type: "array", items: { type: "object", additionalProperties: true } }, scoring_assumptions: { type: "array", items: { type: "string" } } }, required: ["executive_risk_summary", "ranked_threats", "scoring_assumptions"] }),
    prompts: [{ id: "dread-system", role: "system", content: "@prompts/dread-prioritize_system.md" }, { id: "dread-user", role: "user", content: "@prompts/dread-prioritize_user.md" }], memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
  } }, type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false },
  { id: "responseNode_triggerNode_1", data: { label: "Response", nodeId: "graphqlResponseNode", values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "executive_risk_summary": "${{InstructorLLMNode_161.output.executive_risk_summary}}",\n  "ranked_threats": "${{InstructorLLMNode_161.output.ranked_threats}}",\n  "scoring_assumptions": "${{InstructorLLMNode_161.output.scoring_assumptions}}"\n}' }, disabled: false, isResponseNode: true }, type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false },
];
export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_161", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_161", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_161-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_161", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];
export default { meta, inputs, references, nodes, edges };
