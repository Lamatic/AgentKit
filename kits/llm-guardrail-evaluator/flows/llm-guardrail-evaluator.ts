// Flow: llm-guardrail-evaluator

// -- Meta --
export const meta = {
  "name": "llm-guardrail-evaluator",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sheikh Rahul",
    "email": "sheikhrahul8581@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_769": [
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
    "llm_guardrail_evaluator_instructor_llmnode_769_system_0": "@prompts/llm-guardrail-evaluator_instructor-llmnode-769_system_0.md",
    "llm_guardrail_evaluator_instructor_llmnode_769_user_1": "@prompts/llm-guardrail-evaluator_instructor-llmnode-769_user_1.md"
  },
  "modelConfigs": {
    "llm_guardrail_evaluator_instructor_llmnode_769_generative_model_name": "@model-configs/llm-guardrail-evaluator_instructor-llmnode-769_generative-model-name.ts"
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
        "advance_schema": "{\n  \"system_prompt\": \"string\",\n  \"llm_response\": \"string\",\n  \"evaluation_criteria\": \"string\"\n}"
      }
    }
  },
  {
    "id": "InstructorLLMNode_769",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"pass\": {\n      \"type\": \"boolean\"\n    },\n    \"reason\": {\n      \"type\": \"string\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/llm-guardrail-evaluator_instructor-llmnode-769_system_0.md"
          },
          {
            "id": "6ed8dd49-82bd-46fc-9efb-291f686cef74",
            "role": "user",
            "content": "@prompts/llm-guardrail-evaluator_instructor-llmnode-769_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/llm-guardrail-evaluator_instructor-llmnode-769_generative-model-name.ts"
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
        "outputMapping": "{\n  \"pass\": \"true\",\n  \"reason\": \"string\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-InstructorLLMNode_769",
    "source": "triggerNode_1",
    "target": "InstructorLLMNode_769",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_769-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_769",
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
