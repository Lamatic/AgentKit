// Flow: hybrid-rrf-search

// -- Meta --
export const meta = {
  "name": "hybrid rrf search",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Yash Hirani",
    "email": "yash.hirani.work@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_687": [
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
    "hybrid_rrf_search_instructor_llmnode_687_system_0": "@prompts/hybrid-rrf-search_instructor-llmnode-687_system_0.md",
    "hybrid_rrf_search_instructor_llmnode_687_user_1": "@prompts/hybrid-rrf-search_instructor-llmnode-687_user_1.md"
  },
  "modelConfigs": {
    "hybrid_rrf_search_hybrid_search_node_957_embedding_model_name": "@model-configs/hybrid-rrf-search_hybrid-search-node-957_embedding-model-name.ts",
    "hybrid_rrf_search_instructor_llmnode_687_generative_model_name": "@model-configs/hybrid-rrf-search_instructor-llmnode-687_generative-model-name.ts"
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
    "id": "hybridSearchNode_957",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "hybridSearchNode",
      "values": {
        "id": "hybridSearchNode_957",
        "alpha": "0.5",
        "limit": 20,
        "autocut": "0",
        "filters": "[]",
        "nodeName": "Hybrid Search",
        "vectorDB": "hybridRRFRanking",
        "certainty": "0",
        "fusionType": "rankedFusion",
        "searchQuery": "{{triggerNode_1.output.query}}",
        "boostProperties": false,
        "embeddingModelName": "@model-configs/hybrid-rrf-search_hybrid-search-node-957_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "InstructorLLMNode_687",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"results\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"id\": {\n            \"type\": \"string\"\n          },\n          \"content\": {\n            \"type\": \"string\"\n          },\n          \"score\": {\n            \"type\": \"number\"\n          }\n        },\n        \"additionalProperties\": true\n      }\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/hybrid-rrf-search_instructor-llmnode-687_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/hybrid-rrf-search_instructor-llmnode-687_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/hybrid-rrf-search_instructor-llmnode-687_generative-model-name.ts"
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
        "outputMapping": "{\n  \"results\": \"{{InstructorLLMNode_687.output.results}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "InstructorLLMNode_687-responseNode_triggerNode_1",
    "source": "InstructorLLMNode_687",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "hybridSearchNode_957-InstructorLLMNode_687-148",
    "source": "hybridSearchNode_957",
    "target": "InstructorLLMNode_687",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-hybridSearchNode_957-573",
    "source": "triggerNode_1",
    "target": "hybridSearchNode_957",
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
