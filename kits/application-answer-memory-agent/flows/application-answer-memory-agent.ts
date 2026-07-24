// Flow: application-answer-memory-agent

// -- Meta --
export const meta = {
  "name": "Application Answer Memory Agent",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Nicolas Brun",
    "email": "nicolaabrun@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "llmNode": [
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
    "application_answer_memory_agent_llm_node_system_0": "@prompts/application-answer-memory-agent_llm-node_system_0.md",
    "application_answer_memory_agent_llm_node_user_1": "@prompts/application-answer-memory-agent_llm-node_user_1.md"
  },
  "modelConfigs": {
    "application_answer_memory_agent_llm_node_generative_model_name": "@model-configs/application-answer-memory-agent_llm-node_generative-model-name.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "trigger",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "trigger",
        "headers": "",
        "retries": "0",
        "nodeName": "API Request",
        "webhookUrl": "",
        "responeType": "realtime",
        "retry_deplay": "0",
        "advance_schema": "{\n  \"new_question\": \"string\",\n  \"past_answers\": \"string\"\n}"
      }
    }
  },
  {
    "id": "llmNode",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "id": "llmNode",
        "tools": [],
        "prompts": [
          {
            "id": "58cb5eba-e70e-4b4f-bcc0-539c31ead4a9",
            "role": "system",
            "content": "@prompts/application-answer-memory-agent_llm-node_system_0.md"
          },
          {
            "id": "daefb999-3b48-4e77-b2e6-74f8b100d0a4",
            "role": "user",
            "content": "@prompts/application-answer-memory-agent_llm-node_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/application-answer-memory-agent_llm-node_generative-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"response\": \"{{llmNode.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "trigger-llmNode",
    "source": "trigger",
    "target": "llmNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "llmNode-responseNode",
    "source": "llmNode",
    "target": "responseNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger",
    "source": "trigger",
    "target": "responseNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
