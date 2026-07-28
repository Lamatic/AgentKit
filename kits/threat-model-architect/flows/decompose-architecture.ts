export const meta = {
  name: "decompose-architecture",
  description:
    "Normalizes captured system context into components, actors, trust boundaries, entry points, and data flows.",
  tags: ["security", "architecture", "threat-modeling"],
  testInput: '{"session_state":"{\\"system_name\\":\\"Acme Ledger\\",\\"purpose\\":\\"Process customer invoices\\",\\"components\\":[{\\"id\\":\\"web\\",\\"name\\":\\"Web app\\",\\"type\\":\\"frontend\\",\\"description\\":\\"Customer UI\\",\\"technologies\\":[\\"Next.js\\"]}],\\"data_assets\\":[{\\"id\\":\\"invoice\\",\\"name\\":\\"Invoice\\",\\"sensitivity\\":\\"confidential\\",\\"description\\":\\"Customer invoice data\\"}],\\"trust_boundaries\\":[{\\"id\\":\\"internet\\",\\"from_component_id\\":\\"user\\",\\"to_component_id\\":\\"web\\",\\"data_flows\\":[\\"HTTPS requests\\"],\\"protocol\\":\\"HTTPS\\"}],\\"user_roles\\":[\\"customer\\"],\\"compliance_notes\\":[],\\"tech_stack\\":[\\"Next.js\\"]}"}',
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
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"session_state\": \"string\"\n}"
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
    "id": "InstructorLLMNode_158",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_158",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"system_name\": {\n      \"type\": \"string\"\n    },\n    \"purpose\": {\n      \"type\": \"string\"\n    },\n    \"components\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"type\": {\n            \"type\": \"string\"\n          },\n          \"technologies\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": {\n            \"type\": \"string\"\n          },\n          \"trust_zone\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"name\",\n          \"type\",\n          \"technologies\",\n          \"description\",\n          \"trust_zone\",\n          \"confidence\"\n        ]\n      }\n    },\n    \"external_actors\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"type\": {\n            \"type\": \"string\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          },\n          \"trust_zone\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"name\",\n          \"type\",\n          \"description\",\n          \"trust_zone\"\n        ]\n      }\n    },\n    \"data_assets\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"sensitivity\": {\n            \"type\": \"string\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"name\",\n          \"sensitivity\",\n          \"description\"\n        ]\n      }\n    },\n    \"trust_boundaries\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"from_zone\": {\n            \"type\": \"string\"\n          },\n          \"to_zone\": {\n            \"type\": \"string\"\n          },\n          \"components_crossed\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"description\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"name\",\n          \"from_zone\",\n          \"to_zone\",\n          \"components_crossed\",\n          \"description\"\n        ]\n      }\n    },\n    \"data_flows\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"from_component_id\": {\n            \"type\": \"string\"\n          },\n          \"to_component_id\": {\n            \"type\": \"string\"\n          },\n          \"protocol\": {\n            \"type\": \"string\"\n          },\n          \"data_assets\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          },\n          \"authentication\": {\n            \"type\": \"string\"\n          },\n          \"confidence\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"from_component_id\",\n          \"to_component_id\",\n          \"protocol\",\n          \"data_assets\",\n          \"authentication\",\n          \"confidence\"\n        ]\n      }\n    },\n    \"entry_points\": {\n      \"type\": \"array\",\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"name\": {\n            \"type\": \"string\"\n          },\n          \"component_id\": {\n            \"type\": \"string\"\n          },\n          \"exposed_to\": {\n            \"type\": \"string\"\n          },\n          \"description\": {\n            \"type\": \"string\"\n          }\n        },\n        \"required\": [\n          \"id\",\n          \"name\",\n          \"component_id\",\n          \"exposed_to\",\n          \"description\"\n        ]\n      }\n    },\n    \"security_assumptions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"missing_info\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\n    \"system_name\",\n    \"purpose\",\n    \"components\",\n    \"external_actors\",\n    \"data_assets\",\n    \"trust_boundaries\",\n    \"data_flows\",\n    \"entry_points\",\n    \"security_assumptions\",\n    \"missing_info\"\n  ]\n}",
        "prompts": [
          {
            "id": "decompose-system",
            "role": "system",
            "content": "@prompts/decompose-architecture_system.md"
          },
          {
            "id": "decompose-user",
            "role": "user",
            "content": "@prompts/decompose-architecture_user.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": ""
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
        "outputMapping": "{\n  \"system_name\": \"${{InstructorLLMNode_158.output.system_name}}\",\n  \"purpose\": \"${{InstructorLLMNode_158.output.purpose}}\",\n  \"components\": \"${{InstructorLLMNode_158.output.components}}\",\n  \"external_actors\": \"${{InstructorLLMNode_158.output.external_actors}}\",\n  \"data_assets\": \"${{InstructorLLMNode_158.output.data_assets}}\",\n  \"trust_boundaries\": \"${{InstructorLLMNode_158.output.trust_boundaries}}\",\n  \"data_flows\": \"${{InstructorLLMNode_158.output.data_flows}}\",\n  \"entry_points\": \"${{InstructorLLMNode_158.output.entry_points}}\",\n  \"security_assumptions\": \"${{InstructorLLMNode_158.output.security_assumptions}}\",\n  \"missing_info\": \"${{InstructorLLMNode_158.output.missing_info}}\"\n}"
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
    "id": "triggerNode_1-InstructorLLMNode_158",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_158",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_158-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_158",
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
