// Flow: execution-flow

// -- Meta --
export const meta = {
  "name": "execution-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kishan C",
    "email": "kishanc5980@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_603": [
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
    "execution_flow_instructor_llmnode_603_system_0": "@prompts/execution-flow_instructor-llmnode-603_system_0.md",
    "execution_flow_instructor_llmnode_603_user_1": "@prompts/execution-flow_instructor-llmnode-603_user_1.md"
  },
  "modelConfigs": {
    "execution_flow_instructor_llmnode_603_generative_model_name": "@model-configs/execution-flow_instructor-llmnode-603_generative-model-name.ts"
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
        "advance_schema": "{\n  \"selectedIdea\": \"string\",\n  \"blueprint\": \"string\",\n  \"duration\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_603",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"roadmap\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"week\": {\n            \"type\": \"string\"\n          },\n          \"task\": {\n            \"type\": \"string\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"abstract\": {\n      \"type\": \"string\"\n    },\n    \"vivaQuestions\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    },\n    \"resumeBullets\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/execution-flow_instructor-llmnode-603_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/execution-flow_instructor-llmnode-603_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/execution-flow_instructor-llmnode-603_generative-model-name.ts"
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
        "outputMapping": "{\n  \"roadmap\": \"{{InstructorLLMNode_603.output.roadmap}}\",\n  \"abstract\": \"{{InstructorLLMNode_603.output.abstract}}\",\n  \"vivaQuestions\": \"{{InstructorLLMNode_603.output.vivaQuestions}}\",\n  \"resumeBullets\": \"{{InstructorLLMNode_603.output.resumeBullets}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_603",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_603",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_603-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_603",
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
