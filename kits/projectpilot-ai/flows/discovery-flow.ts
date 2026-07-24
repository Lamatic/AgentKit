// Flow: discovery-flow

// -- Meta --
export const meta = {
  "name": "discovery-flow",
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
  "InstructorLLMNode_710": [
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
    "discovery_flow_instructor_llmnode_710_system_0": "@prompts/discovery-flow_instructor-llmnode-710_system_0.md",
    "discovery_flow_instructor_llmnode_710_user_1": "@prompts/discovery-flow_instructor-llmnode-710_user_1.md"
  },
  "modelConfigs": {
    "discovery_flow_instructor_llmnode_710_generative_model_name": "@model-configs/discovery-flow_instructor-llmnode-710_generative-model-name.ts"
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
        "advance_schema": "{\n  \"branch\": \"string\",\n  \"interest\": \"string\",\n  \"skillLevel\": \"string\",\n  \"duration\": \"string\",\n  \"teamType\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_710",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"ideas\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"difficulty\": {\n            \"type\": \"string\"\n          },\n          \"industryRelevance\": {\n            \"type\": \"string\"\n          },\n          \"innovationScore\": {\n            \"type\": \"number\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/discovery-flow_instructor-llmnode-710_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/discovery-flow_instructor-llmnode-710_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/discovery-flow_instructor-llmnode-710_generative-model-name.ts"
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
        "outputMapping": "{\n  \"ideas\": \"{{InstructorLLMNode_710.output.ideas}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_710",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_710",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_710-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_710",
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
