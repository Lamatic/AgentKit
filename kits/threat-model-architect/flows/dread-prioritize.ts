export const meta = {
  name: "dread-prioritize",
  description: "Scores researched threats using DREAD and returns a ranked risk register.",
  tags: ["security", "dread", "risk"],
  testInput: '{"stride_analysis":"{\\"threats\\":[{\\"id\\":\\"T1\\",\\"title\\":\\"API caller spoofing\\",\\"description\\":\\"A caller may impersonate a tenant user.\\",\\"impact\\":\\"Unauthorized invoice access.\\"}]}","research_findings":"{\\"research_findings\\":[{\\"threat_id\\":\\"T1\\",\\"status\\":\\"research_needed\\",\\"owasp_category\\":\\"A07\\",\\"cwe_ids\\":[\\"CWE-287\\"],\\"risk_pattern\\":\\"Authentication failure\\",\\"validation_steps\\":[\\"Review token validation\\"],\\"source_types\\":[\\"OWASP cheat sheet\\"],\\"verified_cves\\":[]}],\\"research_limitations\\":[\\"No live CVE or advisory lookup is connected to this flow.\\"]}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};
export const inputs = { InstructorLLMNode_161: [{
  name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for DREAD scoring.",
  modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" },
}] };
export const references = { prompts: { system: "@prompts/dread-prioritize_system.md", user: "@prompts/dread-prioritize_user.md" }, constitutions: { default: "@constitutions/default.md" } };
const outputSchema = {
  type: "object",
  properties: {
    executive_risk_summary: { type: "string" },
    ranked_threats: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          threat_id: { type: "string" },
          title: { type: "string" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          damage: { type: "integer", minimum: 1, maximum: 10 },
          reproducibility: { type: "integer", minimum: 1, maximum: 10 },
          exploitability: { type: "integer", minimum: 1, maximum: 10 },
          affected_users: { type: "integer", minimum: 1, maximum: 10 },
          discoverability: { type: "integer", minimum: 1, maximum: 10 },
          total: { type: "integer", minimum: 5, maximum: 50 },
          rationale: { type: "string" },
          assumptions: { type: "array", items: { type: "string" } },
        },
        required: ["threat_id", "title", "priority", "damage", "reproducibility", "exploitability", "affected_users", "discoverability", "total", "rationale", "assumptions"],
      },
    },
    scoring_assumptions: { type: "array", items: { type: "string" } },
  },
  required: ["executive_risk_summary", "ranked_threats", "scoring_assumptions"],
};
export const config_json = {
  nodes: [
  { id: "triggerNode_1", data: { modes: {}, nodeId: "graphqlNode", values: { id: "triggerNode_1", nodeName: "API Request", responeType: "realtime", advance_schema: '{\n  "stride_analysis": "string",\n  "research_findings": "string"\n}' }, trigger: true }, type: "triggerNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 0 }, selected: false },
  { id: "InstructorLLMNode_161", data: { label: "dynamicNode node", modes: {}, nodeId: "InstructorLLMNode", values: {
    id: "InstructorLLMNode_161", tools: [], schema: JSON.stringify(outputSchema, null, 2),
    prompts: [{ id: "dread-system", role: "system", content: "@prompts/dread-prioritize_system.md" }, { id: "dread-user", role: "user", content: "@prompts/dread-prioritize_user.md" }], memories: "[]", messages: "[]", nodeName: "Generate JSON", attachments: "", generativeModelName: "",
  } }, type: "dynamicNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 130 }, selected: false },
  { id: "responseNode_triggerNode_1", data: { label: "Response", nodeId: "graphqlResponseNode", values: { headers: '{"content-type":"application/json"}', retries: "0", nodeName: "API Response", webhookUrl: "", retry_delay: "0", outputMapping: '{\n  "executive_risk_summary": "${{InstructorLLMNode_161.output.executive_risk_summary}}",\n  "ranked_threats": "${{InstructorLLMNode_161.output.ranked_threats}}",\n  "scoring_assumptions": "${{InstructorLLMNode_161.output.scoring_assumptions}}"\n}' }, disabled: false, isResponseNode: true }, type: "responseNode", measured: { width: 216, height: 93 }, position: { x: 0, y: 260 }, selected: false },
  ],
  edges: [
  { id: "triggerNode_1-InstructorLLMNode_161", type: "defaultEdge", source: "triggerNode_1", target: "InstructorLLMNode_161", sourceHandle: "bottom", targetHandle: "top" },
  { id: "InstructorLLMNode_161-responseNode_triggerNode_1", type: "defaultEdge", source: "InstructorLLMNode_161", target: "responseNode_triggerNode_1", sourceHandle: "bottom", targetHandle: "top" },
  { id: "response-trigger_triggerNode_1", type: "responseEdge", source: "triggerNode_1", target: "responseNode_triggerNode_1", selected: false, sourceHandle: "to-response", targetHandle: "from-trigger" },
  ],
};
export const nodes = config_json.nodes;
export const edges = config_json.edges;

export default { meta, inputs, references, nodes, edges, config_json };
