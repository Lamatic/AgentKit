// Flow: exam-question-paper-generator

// -- Meta --
export const meta = {
  "name": "exam-question-paper-generator",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "nikhil",
    "email": "nikhilmb@technoconnectai.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_644": [
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
    "exam_question_paper_generator_llmnode_644_system_0": "@prompts/exam-question-paper-generator_llmnode-644_system_0.md",
    "exam_question_paper_generator_llmnode_644_user_1": "@prompts/exam-question-paper-generator_llmnode-644_user_1.md"
  },
  "modelConfigs": {
    "exam_question_paper_generator_llmnode_644_generative_model_name": "@model-configs/exam-question-paper-generator_llmnode-644_generative-model-name.ts"
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
        "advance_schema": "{\n  \"subject\": \"string\",\n  \"grade\": \"string\",\n  \"board\": \"string\",\n  \"topics\": \"string\",\n  \"difficulty\": \"string\",\n  \"total_marks\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_644",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/exam-question-paper-generator_llmnode-644_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/exam-question-paper-generator_llmnode-644_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/exam-question-paper-generator_llmnode-644_generative-model-name.ts"
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
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\"question_paper\": \"{{LLMNode_644.output.generatedResponse}}\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_644",
    "source": "triggerNode_1",
    "target": "LLMNode_644",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_644-responseNode_triggerNode_1",
    "source": "LLMNode_644",
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
