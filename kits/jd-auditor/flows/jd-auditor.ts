// Flow: jd-auditor

// -- Meta --
export const meta = {
  "name": "jd-auditor",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "",
    "email": "namrataylp@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "LLMNode_121": [
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
    "jd_auditor_llmnode_121_system_0": "@prompts/jd-auditor_llmnode-121_system_0.md",
    "jd_auditor_llmnode_121_user_1": "@prompts/jd-auditor_llmnode-121_user_1.md"
  },
  "modelConfigs": {
    "jd_auditor_llmnode_121_generative_model_name": "@model-configs/jd-auditor_llmnode-121_generative-model-name.ts"
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
        "advance_schema": "{\n  \"job_description\": \"string\",\n  \"company_name?\": \"string\"\n}"
      }
    }
  },
  {
    "id": "LLMNode_121",
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
            "content": "@prompts/jd-auditor_llmnode-121_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/jd-auditor_llmnode-121_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Analyzer",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/jd-auditor_llmnode-121_generative-model-name.ts"
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
        "outputMapping": "{\n  \"analysis\": \"{{LLMNode_121.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_121",
    "source": "triggerNode_1",
    "target": "LLMNode_121",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_121-responseNode_triggerNode_1",
    "source": "LLMNode_121",
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
