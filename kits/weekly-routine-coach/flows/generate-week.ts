// Flow: generate-week

export const meta = {
  "name": "generate-week",
  "description": "Places sleep, fixed commitments, meals/breaks and recurring goals on a 7-day 30-minute grid. Declares unmet goals when targets don't fit.",
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
  "InstructorLLMNode_939": [
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
    system: "@prompts/generate-week_system.md",
    user: "@prompts/generate-week_user.md"
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
        "advance_schema": "{\n  \"week_start_date\": \"string\",\n  \"language\": \"string\",\n  \"categories\": \"[string]\",\n  \"fixed_commitments\": \"[string]\",\n  \"recurring_goals\": \"string\",\n  \"oneoff_events\": \"[string]\",\n  \"preferences\": {}\n}"
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
    "id": "InstructorLLMNode_939",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_939",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"week_start_date\": {\n      \"type\": \"string\"\n    },\n    \"blocks\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"day\": {\n            \"type\": \"string\"\n          },\n          \"start\": {\n            \"type\": \"string\"\n          },\n          \"end\": {\n            \"type\": \"string\"\n          },\n          \"kind\": {\n            \"type\": \"string\"\n          },\n          \"label\": {\n            \"type\": \"string\"\n          },\n          \"category_id\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"unmet_goals\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"goal_id\": {\n            \"type\": \"string\"\n          },\n          \"goal_label\": {\n            \"type\": \"string\"\n          },\n          \"target_hours\": {\n            \"type\": \"number\"\n          },\n          \"scheduled_hours\": {\n            \"type\": \"number\"\n          },\n          \"gap_hours\": {\n            \"type\": \"number\"\n          },\n          \"reason\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"summary\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/generate-week_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/generate-week_user.md"
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
        "outputMapping": "{\n  \"week_start_date\": \"${{InstructorLLMNode_939.output.week_start_date}}\",\n  \"blocks\": \"${{InstructorLLMNode_939.output.blocks}}\",\n  \"unmet_goals\": \"${{InstructorLLMNode_939.output.unmet_goals}}\",\n  \"summary\": \"${{InstructorLLMNode_939.output.summary}}\"\n}"
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
    "id": "triggerNode_1-InstructorLLMNode_939",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_939-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_939",
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
