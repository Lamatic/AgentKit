// Flow: blueprint-flow

// -- Meta --
export const meta = {
  "name": "blueprint-flow",
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
  "InstructorLLMNode_851": [
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
    "blueprint_flow_instructor_llmnode_851_system_0": "@prompts/blueprint-flow_instructor-llmnode-851_system_0.md",
    "blueprint_flow_instructor_llmnode_851_user_1": "@prompts/blueprint-flow_instructor-llmnode-851_user_1.md"
  },
  "modelConfigs": {
    "blueprint_flow_instructor_llmnode_851_generative_model_name": "@model-configs/blueprint-flow_instructor-llmnode-851_generative-model-name.ts"
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
        "advance_schema": "{\n  \"selectedIdea\": \"string\",\n  \"skillLevel\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_851",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"frontend\": {\n      \"type\": \"string\"\n    },\n    \"backend\": {\n      \"type\": \"string\"\n    },\n    \"database\": {\n      \"type\": \"string\"\n    },\n    \"aiFrameworks\": {\n      \"type\": \"string\"\n    },\n    \"deployment\": {\n      \"type\": \"string\"\n    },\n    \"architectureExplanation\": {\n      \"type\": \"string\"\n    },\n    \"datasets\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/blueprint-flow_instructor-llmnode-851_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/blueprint-flow_instructor-llmnode-851_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/blueprint-flow_instructor-llmnode-851_generative-model-name.ts"
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
        "outputMapping": "{\n  \"frontend\": \"{{InstructorLLMNode_851.output.frontend}}\",\n  \"backend\": \"{{InstructorLLMNode_851.output.backend}}\",\n  \"database\": \"{{InstructorLLMNode_851.output.database}}\",\n  \"aiFrameworks\": \"{{InstructorLLMNode_851.output.aiFrameworks}}\",\n  \"deployment\": \"{{InstructorLLMNode_851.output.deployment}}\",\n  \"architectureExplanation\": \"{{InstructorLLMNode_851.output.architectureExplanation}}\",\n  \"datasets\": \"{{InstructorLLMNode_851.output.datasets}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_851",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_851",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_851-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_851",
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
