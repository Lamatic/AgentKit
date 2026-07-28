export const meta = {
  name: "stride-analyze",
  description: "Produces stack-specific STRIDE threats from a normalized architecture model.",
  tags: ["security", "stride", "threat-modeling"],
  testInput: '{"architecture":"{\\"system_name\\":\\"Acme Ledger\\",\\"purpose\\":\\"Process invoices\\",\\"components\\":[{\\"id\\":\\"api\\",\\"name\\":\\"API\\",\\"type\\":\\"service\\",\\"technologies\\":[\\"Node.js\\"],\\"description\\":\\"Invoice API\\",\\"trust_zone\\":\\"application\\",\\"confidence\\":\\"high\\"}],\\"external_actors\\":[{\\"id\\":\\"customer\\",\\"name\\":\\"Customer\\",\\"type\\":\\"user\\",\\"description\\":\\"Tenant user\\",\\"trust_zone\\":\\"internet\\"}],\\"data_assets\\":[{\\"id\\":\\"invoice\\",\\"name\\":\\"Invoice\\",\\"sensitivity\\":\\"confidential\\",\\"description\\":\\"Tenant invoice data\\"}],\\"trust_boundaries\\":[{\\"id\\":\\"tb-1\\",\\"name\\":\\"Internet boundary\\",\\"from_zone\\":\\"internet\\",\\"to_zone\\":\\"application\\",\\"components_crossed\\":[\\"api\\"],\\"description\\":\\"Public API boundary\\"}],\\"data_flows\\":[{\\"id\\":\\"flow-1\\",\\"from_component_id\\":\\"customer\\",\\"to_component_id\\":\\"api\\",\\"protocol\\":\\"HTTPS\\",\\"data_assets\\":[\\"invoice\\"],\\"authentication\\":\\"OIDC\\",\\"confidence\\":\\"high\\"}],\\"entry_points\\":[{\\"id\\":\\"entry-1\\",\\"name\\":\\"Invoice API\\",\\"component_id\\":\\"api\\",\\"exposed_to\\":\\"internet\\",\\"description\\":\\"Public HTTPS endpoint\\"}],\\"security_assumptions\\":[],\\"missing_info\\":[]}"}',
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

const outputSchema = {
  type: "object",
  properties: {
    system_name: { type: "string" },
    summary: { type: "string" },
    threats: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          stride_category: {
            type: "string",
            enum: ["spoofing", "tampering", "repudiation", "information_disclosure", "denial_of_service", "elevation_of_privilege"],
          },
          component_ids: { type: "array", items: { type: "string" } },
          data_flow_ids: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          impact: { type: "string" },
          preconditions: { type: "array", items: { type: "string" } },
          evidence: { type: "string", enum: ["stated", "inferred"] },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          mitigations: { type: "array", minItems: 1, items: { type: "string" } },
          open_questions: { type: "array", items: { type: "string" } },
        },
        required: ["id", "title", "stride_category", "component_ids", "data_flow_ids", "description", "impact", "preconditions", "evidence", "confidence", "mitigations", "open_questions"],
      },
    },
    coverage: {
      type: "object",
      properties: {
        analyzed_components: { type: "array", items: { type: "string" } },
        stride_categories_covered: {
          type: "array",
          uniqueItems: true,
          items: {
            type: "string",
            enum: [
              "spoofing",
              "tampering",
              "repudiation",
              "information_disclosure",
              "denial_of_service",
              "elevation_of_privilege",
            ],
          },
        },
      },
      required: ["analyzed_components", "stride_categories_covered"],
    },
    missing_info: { type: "array", items: { type: "string" } },
  },
  required: ["system_name", "summary", "threats", "coverage", "missing_info"],
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
        schema: "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"system_name\": {\n      \"type\": \"string\"\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    },\n    \"threats\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"stride_category\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"spoofing\",\n              \"tampering\",\n              \"repudiation\",\n              \"information_disclosure\",\n              \"denial_of_service\",\n              \"elevation_of_privilege\"\n            ]\n          },\n          \"component_ids\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"data_flow_ids\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": {\n            \"type\": \"string\"\n          },\n          \"impact\": {\n            \"type\": \"string\"\n          },\n          \"preconditions\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"evidence\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"stated\",\n              \"inferred\"\n            ]\n          },\n          \"confidence\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"low\",\n              \"medium\",\n              \"high\"\n            ]\n          },\n          \"mitigations\": {\n            \"type\": \"array\",\n            \"minItems\": 1,\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"open_questions\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"title\",\n          \"stride_category\",\n          \"component_ids\",\n          \"data_flow_ids\",\n          \"description\",\n          \"impact\",\n          \"preconditions\",\n          \"evidence\",\n          \"confidence\",\n          \"mitigations\",\n          \"open_questions\"\n        ]\n      }\n    },\n    \"coverage\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"analyzed_components\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"stride_categories_covered\": {\n          \"type\": \"array\",\n          \"uniqueItems\": true,\n          \"items\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"spoofing\",\n              \"tampering\",\n              \"repudiation\",\n              \"information_disclosure\",\n              \"denial_of_service\",\n              \"elevation_of_privilege\"\n            ]\n          }\n        }\n      },\n      \"required\": [\n        \"analyzed_components\",\n        \"stride_categories_covered\"\n      ]\n    },\n    \"missing_info\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\n    \"system_name\",\n    \"summary\",\n    \"threats\",\n    \"coverage\",\n    \"missing_info\"\n  ]\n}",
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
