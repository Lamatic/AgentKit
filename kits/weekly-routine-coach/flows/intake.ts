// Flow: intake

export const meta = {
  "name": "intake",
  "description": "Conversational extraction of goals, fixed commitments and preferences. Returns updated session_state until ready to generate.",
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
  "InstructorLLMNode_792": [
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
    system: "@prompts/intake_system.md",
    user: "@prompts/intake_user.md"
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
        "advance_schema": "{\n  \"message\": \"string\",\n  \"today\": \"string\",\n  \"session_state\": {}\n}"
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
    "id": "InstructorLLMNode_792",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_792",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"language\": {\n      \"type\": \"string\"\n    },\n    \"assistant_message\": {\n      \"type\": \"string\"\n    },\n    \"is_complete\": {\n      \"type\": \"boolean\"\n    },\n    \"session_state\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"language\": {\n          \"type\": \"string\"\n        },\n        \"categories\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"id\": {\n                \"type\": \"string\"\n              },\n              \"name\": {\n                \"type\": \"string\"\n              },\n              \"color\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"fixed_commitments\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"id\": {\n                \"type\": \"string\"\n              },\n              \"day\": {\n                \"type\": \"string\"\n              },\n              \"start\": {\n                \"type\": \"string\"\n              },\n              \"end\": {\n                \"type\": \"string\"\n              },\n              \"label\": {\n                \"type\": \"string\"\n              },\n              \"category_id\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"recurring_goals\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"id\": {\n                \"type\": \"string\"\n              },\n              \"label\": {\n                \"type\": \"string\"\n              },\n              \"target_hours_per_week\": {\n                \"type\": \"number\"\n              },\n              \"category_id\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"oneoff_events\": {\n          \"type\": \"array\",\n          \"items\": {\n            \"type\": \"object\",\n            \"properties\": {\n              \"id\": {\n                \"type\": \"string\"\n              },\n              \"date\": {\n                \"type\": \"string\"\n              },\n              \"start\": {\n                \"type\": \"string\"\n              },\n              \"end\": {\n                \"type\": \"string\"\n              },\n              \"label\": {\n                \"type\": \"string\"\n              },\n              \"category_id\": {\n                \"type\": \"string\"\n              }\n            },\n            \"additionalProperties\": true\n          }\n        },\n        \"preferences\": {\n          \"type\": \"object\",\n          \"properties\": {\n            \"earliest_wake\": {\n              \"type\": \"string\"\n            },\n            \"latest_sleep\": {\n              \"type\": \"string\"\n            }\n          },\n          \"additionalProperties\": true\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"missing_info\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/intake_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/intake_user.md"
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
        "outputMapping": "{\n  \"language\": \"${{InstructorLLMNode_792.output.language}}\",\n  \"assistant_message\": \"${{InstructorLLMNode_792.output.assistant_message}}\",\n  \"is_complete\": \"${{InstructorLLMNode_792.output.is_complete}}\",\n  \"session_state\": \"${{InstructorLLMNode_792.output.session_state}}\",\n  \"missing_info\": \"${{InstructorLLMNode_792.output.missing_info}}\"\n}"
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
    "selected": true
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_792",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_792",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_792-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_792",
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
