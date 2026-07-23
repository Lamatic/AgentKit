// Flow: scam-message-triage

// -- Meta --
export const meta = {
  "name": "scam-message-triage",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Raz",
    "email": "skrazzakhussain@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "RAGNode_573": [
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
    "scam_message_triage_ragnode_573_system_0": "@prompts/scam-message-triage_ragnode-573_system_0.md",
    "scam_message_triage_ragnode_573_user_1": "@prompts/scam-message-triage_ragnode-573_user_1.md"
  },
  "modelConfigs": {
    "scam_message_triage_ragnode_573_generative_model_name": "@model-configs/scam-message-triage_ragnode-573_generative-model-name.ts",
    "scam_message_triage_ragnode_573_embedding_model_name": "@model-configs/scam-message-triage_ragnode-573_embedding-model-name.ts"
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
        "advance_schema": "{\n  \"message\": \"string\"\n}"
      }
    }
  },
  {
    "id": "RAGNode_573",
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
            "content": "@prompts/scam-message-triage_ragnode-573_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/scam-message-triage_ragnode-573_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "RAG",
        "vectorDB": [
          "scampatterns"
        ],
        "certainty": "0.7",
        "queryField": "{{triggerNode_1.output.message}}",
        "embeddingModelName": "@model-configs/scam-message-triage_ragnode-573_embedding-model-name.ts",
        "generativeModelName": "@model-configs/scam-message-triage_ragnode-573_generative-model-name.ts"
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
        "outputMapping": "{ \"modelResponse\": \"{{RAGNode_573.output.modelResponse}}\", \"references\": \"{{RAGNode_573.output.references}}\" }"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_573",
    "source": "triggerNode_1",
    "target": "RAGNode_573",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_573-responseNode_triggerNode_1",
    "source": "RAGNode_573",
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
