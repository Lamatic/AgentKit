// Flow: replan

export const meta = {
  "name": "replan",
  "description": "Reacts to a single change event (slip, new event, completed) and reshuffles goal blocks while minimizing churn.",
  "tags": [
    "agentic",
    "productivity",
    "scheduling"
  ],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Igor Michalski",
    "email": "igorroberto2312@gmail.com"
  }
};

export const inputs = {
  "InstructorLLMNode_125": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ]
};

export const references = {
  prompts: {
    system: "@prompts/replan_system.md",
    user: "@prompts/replan_user.md"
  },
  constitutions: {
    default: "@constitutions/default.md"
  }
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
        "advance_schema": "{\n  \"current_blocks\": \"string\",\n  \"language\": \"string\",\n  \"categories\": \"[string]\",\n  \"recurring_goals\": \"[string]\",\n  \"fixed_commitments\": \"[string]\",\n  \"preferences\": {},\n  \"change\": {}\n}"
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
    "id": "InstructorLLMNode_125",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_125",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"updated_blocks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"day\": {\n            \"type\": \"string\"\n          },\n          \"start\": {\n            \"type\": \"string\"\n          },\n          \"end\": {\n            \"type\": \"string\"\n          },\n          \"kind\": {\n            \"type\": \"string\"\n          },\n          \"label\": {\n            \"type\": \"string\"\n          },\n          \"category_id\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"diff\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"added\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"removed\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"string\"\n          }\n        },\n        \"moved\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"block_id\": {\n                \"type\": \"string\"\n              },\n              \"from\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"day\": {\n                    \"type\": \"string\"\n                  },\n                  \"start\": {\n                    \"type\": \"string\"\n                  }\n                },\n                \"additionalProperties\": true\n              },\n              \"to\": {\n                \"type\": \"object\",\n                \"properties\": {\n                  \"day\": {\n                    \"type\": \"string\"\n                  },\n                  \"start\": {\n                    \"type\": \"string\"\n                  }\n                },\n                \"additionalProperties\": true\n              }\n            },\n            \"additionalProperties\": true\n          }\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"unmet_goals\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/replan_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/replan_user.md"
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
    "selected": true
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
        "outputMapping": "{\n  \"updated_blocks\": \"${{InstructorLLMNode_125.output.updated_blocks}}\",\n  \"diff\": \"${{InstructorLLMNode_125.output.diff}}\",\n  \"unmet_goals\": \"${{InstructorLLMNode_125.output.unmet_goals}}\",\n  \"summary\": \"${{InstructorLLMNode_125.output.summary}}\"\n}"
      },
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
    "id": "triggerNode_1-InstructorLLMNode_125",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_125",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_125-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_125",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
