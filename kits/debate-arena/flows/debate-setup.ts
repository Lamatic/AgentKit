// Flow: debate-setup

// -- Meta --
export const meta = {
  "name": "debate-setup",
  "description": "Turns a raw decision or question into a neutral debate topic plus two clearly opposed positions.",
  "tags": ["generative", "multi-agent", "decision-making"],
  "testInput": {
    "topic": "Should our team use microservices or a monolith?"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "HEMANTH AMARTHI",
    "email": "hemanthkumar.amarthi7@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_980": [
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
    "debate_setup_instructorllmnode_980_system_0": "@prompts/debate-setup_instructorllmnode-980_system_0.md",
    "debate_setup_instructorllmnode_980_user_1": "@prompts/debate-setup_instructorllmnode-980_user_1.md"
  },
  "modelConfigs": {
    "debate_setup_instructorllmnode_980_generative_model_name": "@model-configs/debate-setup_instructorllmnode-980_generative-model-name.ts"
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
        "advance_schema": "{\n  \"topic\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_980",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "id": "InstructorLLMNode_980",
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"cleanTopic\": {\n      \"type\": \"string\"\n    },\n    \"positionA\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"label\": {\n          \"type\": \"string\"\n        },\n        \"stance\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"positionB\": {\n      \"type\": \"object\",\n      \"properties\": {\n        \"label\": {\n          \"type\": \"string\"\n        },\n        \"stance\": {\n          \"type\": \"string\"\n        }\n      },\n      \"additionalProperties\": true\n    },\n    \"context\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/debate-setup_instructorllmnode-980_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/debate-setup_instructorllmnode-980_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/debate-setup_instructorllmnode-980_generative-model-name.ts"
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
        "headers": "{}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"cleanTopic\": \"{{InstructorLLMNode_980.output.cleanTopic}}\",\n  \"positionA\": \"{{InstructorLLMNode_980.output.positionA}}\",\n  \"positionB\": \"{{InstructorLLMNode_980.output.positionB}}\",\n  \"context\": \"{{InstructorLLMNode_980.output.context}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_980",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_980",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_980-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_980",
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
