// Flow: abrasive-lighter

// -- Meta --
export const meta = {
  "name": "DevOps Log Troubleshooter",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Adarsh Gaonkar",
    "email": "gaonkaradarsh38@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "RAGNode_258": [
    {
      "name": "vectorDB",
      "label": "Database",
      "type": "select"
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    },
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "LLMNode_716": [
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
    "abrasive_lighter_ragnode_258_system_0": "@prompts/abrasive-lighter_ragnode-258_system_0.md",
    "abrasive_lighter_ragnode_258_user_1": "@prompts/abrasive-lighter_ragnode-258_user_1.md",
    "abrasive_lighter_llmnode_716_system_0": "@prompts/abrasive-lighter_llmnode-716_system_0.md",
    "abrasive_lighter_llmnode_716_user_1": "@prompts/abrasive-lighter_llmnode-716_user_1.md"
  },
  "modelConfigs": {
    "abrasive_lighter_ragnode_258_generative_model_name": "@model-configs/abrasive-lighter_ragnode-258_generative-model-name.ts",
    "abrasive_lighter_ragnode_258_embedding_model_name": "@model-configs/abrasive-lighter_ragnode-258_embedding-model-name.ts",
    "abrasive_lighter_llmnode_716_generative_model_name": "@model-configs/abrasive-lighter_llmnode-716_generative-model-name.ts"
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
        "advance_schema": "{\n  \"build_logs\": \"string\",\n  \"environment\": \"string\"\n}"
      }
    }
  },
  {
    "id": "RAGNode_258",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "limit": 3,
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/abrasive-lighter_ragnode-258_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/abrasive-lighter_ragnode-258_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "RAG",
        "vectorDB": [
          "devopsTroubleshootingDb"
        ],
        "certainty": "0.7",
        "queryField": "{{triggerNode_1.output.build_logs}}",
        "embeddingModelName": "@model-configs/abrasive-lighter_ragnode-258_embedding-model-name.ts",
        "generativeModelName": "@model-configs/abrasive-lighter_ragnode-258_generative-model-name.ts"
      }
    }
  },
  {
    "id": "LLMNode_716",
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
            "content": "@prompts/abrasive-lighter_llmnode-716_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/abrasive-lighter_llmnode-716_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate Text",
        "attachments": "",
        "credentials": "",
        "generativeModelName": "@model-configs/abrasive-lighter_llmnode-716_generative-model-name.ts"
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
        "outputMapping": "{\n  \"status\": \"success\",\n  \"runbook\": {{LLMNode_716.output}}\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "LLMNode_716-responseNode_triggerNode_1",
    "source": "LLMNode_716",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_258-LLMNode_716",
    "source": "RAGNode_258",
    "target": "LLMNode_716",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-RAGNode_258-172",
    "source": "triggerNode_1",
    "target": "RAGNode_258",
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
