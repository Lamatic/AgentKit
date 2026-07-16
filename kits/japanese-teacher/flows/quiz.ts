// Flow: quiz

// -- Meta --
export const meta = {
  "name": "Quiz",
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
  "InstructorLLMNode_355": [
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
    "quiz_instructor_llmnode_355_system_0": "@prompts/quiz_instructor-llmnode-355_system_0.md",
    "quiz_instructor_llmnode_355_user_1": "@prompts/quiz_instructor-llmnode-355_user_1.md"
  },
  "modelConfigs": {
    "quiz_instructor_llmnode_355_generative_model_name": "@model-configs/quiz_instructor-llmnode-355_generative-model-name.ts"
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
        "advance_schema": "{\n  \"level\": \"string\",\n  \"context\": \"string\",\n  \"question_number\": \"int\",\n  \"question_counts\": {\n    \"grammar\": \"int\",\n    \"vocabulary\": \"int\",\n    \"context\": \"int\",\n    \"kanji\": \"int\"\n  },\n  \"text\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_355",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"Questions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"question_id\": {\n            \"type\": \"string\",\n            \"description\": \"question id\"\n          },\n          \"question_type\": {\n            \"type\": \"string\",\n            \"description\": \"type of the question \"\n          },\n          \"points\": {\n            \"type\": \"number\",\n            \"description\": \"How many points worth\"\n          },\n          \"text\": {\n            \"type\": \"string\",\n            \"description\": \"Question\"\n          },\n          \"options\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            },\n            \"description\": \"[\\\"(a) ...\\\",\\\"(b) ...\\\", ...]\"\n          },\n          \"answer\": {\n            \"type\": \"string\",\n            \"description\": \"answer of the question like \\\"(a)\\\"\"\n          }\n        },\n        \"additionalProperties\": true\n      },\n      \"description\": \"Put all the question\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/quiz_instructor-llmnode-355_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/quiz_instructor-llmnode-355_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/quiz_instructor-llmnode-355_generative-model-name.ts"
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
        "outputMapping": "{\n  \"Questions\": \"{{InstructorLLMNode_355.output.Questions}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_355",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_355",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_355-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_355",
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
