export const meta = {
  name: "threat-research",
  description: "Enriches STRIDE threats with OWASP/CWE mapping and defensible validation research.",
  tags: ["security", "research", "owasp"],
  testInput: '{"architecture":"{\\"system_name\\":\\"Acme Ledger\\",\\"components\\":[{\\"id\\":\\"api\\",\\"technologies\\":[\\"Node.js\\"]}]}","stride_analysis":"{\\"system_name\\":\\"Acme Ledger\\",\\"threats\\":[{\\"id\\":\\"T1\\",\\"title\\":\\"API caller spoofing\\",\\"stride_category\\":\\"spoofing\\",\\"component_ids\\":[\\"api\\"],\\"data_flow_ids\\":[\\"flow-1\\"],\\"description\\":\\"A caller may impersonate a tenant user.\\",\\"impact\\":\\"Unauthorized invoice access.\\",\\"preconditions\\":[\\"API is reachable\\"],\\"evidence\\":\\"inferred\\",\\"confidence\\":\\"medium\\",\\"mitigations\\":[\\"Validate OIDC tokens\\"],\\"open_questions\\":[]}]}"}',
  githubUrl: "https://github.com/Lamatic/AgentKit/tree/main/kits/threat-model-architect",
  documentationUrl: "", deployUrl: "", author: { name: "Kushagra Tiwari" },
};

export const inputs = {
  InstructorLLMNode_160: [{
    name: "generativeModelName", label: "Generative Model Name", type: "model", mode: "instructor", description: "Select a text model for threat research.",
    modelType: "generator/text", required: true, isPrivate: true, defaultValue: [{ configName: "configA", type: "generator/text", provider_name: "", credential_name: "", params: {} }], typeOptions: { loadOptionsMethod: "listModels" },
  }],
};
export const references = {
  prompts: {
    system: "@prompts/threat-research_system.md",
    user: "@prompts/threat-research_user.md",
  },
  modelConfigs: {
    generativeModelName:
      "@model-configs/threat-research_instructor-llmnode-160_generative-model-name.ts",
  },
  constitutions: { default: "@constitutions/default.md" },
};
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"architecture\": \"string\",\n  \"stride_analysis\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_160",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_160",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"research_findings\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"threat_id\": {\n            \"type\": \"string\"\n          },\n          \"status\": {\n            \"type\": \"string\",\n            \"enum\": [\n              \"research_needed\"\n            ]\n          },\n          \"owasp_category\": {\n            \"type\": \"string\"\n          },\n          \"cwe_ids\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"risk_pattern\": {\n            \"type\": \"string\"\n          },\n          \"validation_steps\": {\n            \"type\": \"array\",\n            \"minItems\": 1,\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"source_types\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"verified_cves\": {\n            \"type\": \"array\",\n            \"maxItems\": 0,\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"required\": [\n          \"threat_id\",\n          \"status\",\n          \"owasp_category\",\n          \"cwe_ids\",\n          \"risk_pattern\",\n          \"validation_steps\",\n          \"source_types\",\n          \"verified_cves\"\n        ]\n      }\n    },\n    \"research_summary\": {\n      \"type\": \"string\"\n    },\n    \"research_limitations\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\n    \"research_findings\",\n    \"research_summary\",\n    \"research_limitations\"\n  ]\n}",
        "prompts": [
          {
            "id": "research-system",
            "role": "system",
            "content": "@prompts/threat-research_system.md"
          },
          {
            "id": "research-user",
            "role": "user",
            "content": "@prompts/threat-research_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/threat-research_instructor-llmnode-160_generative-model-name.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"research_findings\": \"${{InstructorLLMNode_160.output.research_findings}}\",\n  \"research_summary\": \"${{InstructorLLMNode_160.output.research_summary}}\",\n  \"research_limitations\": \"${{InstructorLLMNode_160.output.research_limitations}}\"\n}"
      },
      "disabled": false,
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_160",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_160",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_160-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_160",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "selected": false,
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
