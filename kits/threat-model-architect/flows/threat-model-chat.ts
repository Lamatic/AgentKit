export const meta = {
  name: "threat-model-chat", description: "Answers follow-up questions from a completed threat-model report.",
  tags: ["security", "chat", "threat-modeling"], testInput: '{"report":"{}","message":"What should we fix first?"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect", documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};
export const inputs = { InstructorLLMNode_163: [{ name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for report Q&A.", modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" } }] };
export const references = { prompts: { system: "@prompts/threat-model-chat_system.md", user: "@prompts/threat-model-chat_user.md" }, constitutions: { default: "@constitutions/default.md" } };
export const nodes = [
  { id: "triggerNode_1", data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "report": "string",\n  "message": "string"\n}' }, trigger: true }, type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false },
  { id: "InstructorLLMNode_163", data: { label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode", values: {
    id: "InstructorLLMNode_163", tools: [], schema: JSON.stringify({ type: "object", properties: { answer: { type: "string" }, citations: { type: "array", items: { type: "string" } }, follow_up_questions: { type: "array", items: { type: "string" } } } }),
    prompts: [{ id: "chat-system", role: "system", content: "@prompts/threat-model-chat_system.md" }, { id: "chat-user", role: "user", content: "@prompts/threat-model-chat_user.md" }], memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
  } }, type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false },
  { id: "responseNode_triggerNode_1", data: { label: "Response", nodeId: "graphqlResponseNode", values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "answer": "${{InstructorLLMNode_163.output.answer}}",\n  "citations": "${{InstructorLLMNode_163.output.citations}}",\n  "follow_up_questions": "${{InstructorLLMNode_163.output.follow_up_questions}}"\n}' }, disabled: false, isResponseNode: true }, type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false },
];
export const edges = [
  { id: "triggerNode_1-InstructorLLMNode_163", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_163", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_163-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_163", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
];
export default { meta, inputs, references, nodes, edges };
