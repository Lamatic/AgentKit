// Flow: devdiary-ask

// -- Meta --
export const meta = {
  "name": "devdiary-ask",
  "description": "Answers natural-language questions about logged work via RAG over the devdiary vector store, citing project and date.",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Chirag",
    "email": "chiragbaldia@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "RAGNode_381": [
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
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "devdiary_ask_ragnode_381_system_0": "@prompts/devdiary-ask_ragnode-381_system_0.md",
    "devdiary_ask_ragnode_381_user_1": "@prompts/devdiary-ask_ragnode-381_user_1.md"
  },
  "modelConfigs": {
    "devdiary_ask_ragnode_381_generative_model_name": "@model-configs/devdiary-ask_ragnode-381_generative-model-name.ts",
    "devdiary_ask_ragnode_381_embedding_model_name": "@model-configs/devdiary-ask_ragnode-381_embedding-model-name.ts"
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
        "advance_schema": "{\n  \"query\": \"string\"\n}"
      }
    }
  },
  {
    "id": "RAGNode_381",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "limit": 10,
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/devdiary-ask_ragnode-381_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/devdiary-ask_ragnode-381_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "RAG",
        "vectorDB": [
          "devdiary"
        ],
        "certainty": "0.5",
        "queryField": "{{triggerNode_1.output.query}}",
        "embeddingModelName": "@model-configs/devdiary-ask_ragnode-381_embedding-model-name.ts",
        "generativeModelName": "@model-configs/devdiary-ask_ragnode-381_generative-model-name.ts"
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
        "outputMapping": "{\n  \"answer\": \"{{RAGNode_381.output.modelResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_381",
    "source": "triggerNode_1",
    "target": "RAGNode_381",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_381-responseNode_triggerNode_1",
    "source": "RAGNode_381",
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
