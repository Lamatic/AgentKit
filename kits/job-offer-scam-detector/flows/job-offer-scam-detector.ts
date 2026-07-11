// Flow: job-offer-scam-detector

// -- Meta --
export const meta = {
  "name": "Job Offer Scam Detector",
  "description": "Analyzes job offer messages and flags fraud signals like urgency tactics, upfront payment requests, and vague company details.",
  "tags": ["fraud-detection", "career", "safety"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/job-offer-scam-detector",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Rishi Mathur",
    "email": "rishimathur2004@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_167": [
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
    "average_denmark_llmnode_167_system_0": "@prompts/average-denmark_llmnode-167_system_0.md",
    "average_denmark_llmnode_167_user_1": "@prompts/average-denmark_llmnode-167_user_1.md"
  },
  "modelConfigs": {
    "average_denmark_llmnode_167_generative_model_name": "@model-configs/average-denmark_llmnode-167_generative-model-name.ts"
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
        "nodeName": "job_offer_text",
        "responeType": "realtime",
        "advance_schema": "{\n  \"job_offer_text\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_167",
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
            "content": "@prompts/average-denmark_llmnode-167_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/average-denmark_llmnode-167_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/average-denmark_llmnode-167_generative-model-name.ts"
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
        "outputMapping": "{}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_167",
    "source": "triggerNode_1",
    "target": "LLMNode_167",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_167-responseNode_triggerNode_1",
    "source": "LLMNode_167",
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
