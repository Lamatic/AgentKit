// Flow: specforge

// -- Meta --
export const meta = {
  "name": "specforge",
  "description": "Drafts a technical spec from a feature description, critiques it against a quality rubric, then revises and re-scores it before returning the result.",
  "tags": [],
  "testInput": { "feature_description": "Add rate limiting to our public API" },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/specforge",
  "documentationUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/specforge",
  "deployUrl": "",
  "author": {
    "name": "Astitv Bajpai",
    "email": "astitvabajpai22@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_127": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_526": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_120": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_900": [
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
    "specforge_llmnode_127_system_0": "@prompts/specforge_llmnode-127_system_0.md",
    "specforge_llmnode_127_user_1": "@prompts/specforge_llmnode-127_user_1.md",
    "specforge_instructor_llmnode_526_system_0": "@prompts/specforge_instructor-llmnode-526_system_0.md",
    "specforge_instructor_llmnode_526_user_1": "@prompts/specforge_instructor-llmnode-526_user_1.md",
    "specforge_llmnode_120_system_0": "@prompts/specforge_llmnode-120_system_0.md",
    "specforge_llmnode_120_user_1": "@prompts/specforge_llmnode-120_user_1.md",
    "specforge_instructor_llmnode_900_system_0": "@prompts/specforge_instructor-llmnode-900_system_0.md",
    "specforge_instructor_llmnode_900_user_1": "@prompts/specforge_instructor-llmnode-900_user_1.md"
  },
  "modelConfigs": {
    "specforge_llmnode_127_generative_model_name": "@model-configs/specforge_llmnode-127_generative-model-name.ts",
    "specforge_instructor_llmnode_526_generative_model_name": "@model-configs/specforge_instructor-llmnode-526_generative-model-name.ts",
    "specforge_llmnode_120_generative_model_name": "@model-configs/specforge_llmnode-120_generative-model-name.ts",
    "specforge_instructor_llmnode_900_generative_model_name": "@model-configs/specforge_instructor-llmnode-900_generative-model-name.ts"
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
        "nodeName": "triggerNode_1",
        "responeType": "realtime",
        "advance_schema": "{\n  \"feature_description\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_127",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_127",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/specforge_llmnode-127_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/specforge_llmnode-127_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "drafter",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/specforge_llmnode-127_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_526",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_526",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1 },\n    \"issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"score\", \"issues\"]\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/specforge_instructor-llmnode-526_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/specforge_instructor-llmnode-526_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "critique1",
        "attachments": "",
        "generativeModelName": "@model-configs/specforge_instructor-llmnode-526_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_120",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "LLMNode_120",
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/specforge_llmnode-120_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/specforge_llmnode-120_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "reviser",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/specforge_llmnode-120_generative-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_900",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_900",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"score\": { \"type\": \"number\", \"minimum\": 0, \"maximum\": 1 },\n    \"issues\": { \"type\": \"array\", \"items\": { \"type\": \"string\" } }\n  },\n  \"required\": [\"score\", \"issues\"]\n}",
        "prompts": [
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/specforge_instructor-llmnode-900_system_0.md"
          },
          {
            "id": "287c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/specforge_instructor-llmnode-900_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "critique2",
        "attachments": "",
        "generativeModelName": "@model-configs/specforge_instructor-llmnode-900_generative-model-name.ts"
      }
    }
  },
  {
    "id": "endNode_782",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "endNode",
      "values": {
        "id": "endNode_782",
        "nodeName": "End"
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
        "outputMapping": "{\n  \"spec\": \"{{LLMNode_120.output.generatedResponse}}\",\n  \"quality_score\": \"{{InstructorLLMNode_900.output.score}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_127",
    "source": "triggerNode_1",
    "target": "LLMNode_127",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_127-InstructorLLMNode_526",
    "source": "LLMNode_127",
    "target": "InstructorLLMNode_526",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_526-LLMNode_120",
    "source": "InstructorLLMNode_526",
    "target": "LLMNode_120",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_120-InstructorLLMNode_900",
    "source": "LLMNode_120",
    "target": "InstructorLLMNode_900",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_900-endNode_782",
    "source": "InstructorLLMNode_900",
    "target": "endNode_782",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "endNode_782-responseNode_triggerNode_1",
    "source": "endNode_782",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };



