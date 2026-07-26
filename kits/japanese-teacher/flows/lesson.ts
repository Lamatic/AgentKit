// Flow: lesson

// -- Meta --
export const meta = {
  "name": "Lesson",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "aslan qqq",
    "email": "aslanqqq3@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_252": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "lesson_instructor_llmnode_252_system_0": "@prompts/lesson_instructor-llmnode-252_system_0.md",
    "lesson_instructor_llmnode_252_user_1": "@prompts/lesson_instructor-llmnode-252_user_1.md"
  },
  "modelConfigs": {
    "lesson_instructor_llmnode_252_generative_model_name": "@model-configs/lesson_instructor-llmnode-252_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"context\": \"string\",\n  \"level\": \"string\",\n  \"words\": \"[string]\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_252",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"日本語（漢字＋ひらがな）\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Main japanese version\"\n    },\n    \"発音（ローマじ）\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Romanji version\"\n    },\n    \"Translation\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"Translation\"\n    },\n    \"文法とたんごのせつめい\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"たんご／文法\": {\n            \"type\": \"string\",\n            \"description\": \"Word/Grammer\"\n          },\n          \"いみ\": {\n            \"type\": \"string\",\n            \"description\": \"Meaning\"\n          },\n          \"れいぶん・せつめい\": {\n            \"type\": \"string\",\n            \"description\": \"Example/Note\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"Dictionary\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/lesson_instructor-llmnode-252_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/lesson_instructor-llmnode-252_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/lesson_instructor-llmnode-252_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"original\": \"{{InstructorLLMNode_252.output.日本語（漢字＋ひらがな）}}\",\n  \"romanji\": \"{{InstructorLLMNode_252.output.発音（ローマじ）}}\",\n  \"translation\": \"{{InstructorLLMNode_252.output.Translation}}\",\n  \"dictionary\": \"{{InstructorLLMNode_252.output.文法とたんごのせつめい}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_252",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_252",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_252-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_252",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
