// Flow: hybrid-rrf-search

// -- Meta --
export const meta = {
  "name": "Hybrid RRF Search",
  "description": "A hybrid search pipeline combining BM25 keyword search and vector search via Reciprocal Rank Fusion (RRF), with an LLM reranker for top-5 result scoring.",
  "tags": ["search", "hybrid", "reranking", "weaviate", "cohere"],
  "testInput": null,
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/hybrid-rrf-search",
  "documentationUrl": "https://lamatic.ai/docs/nodes/data/hybrid-search-node",
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
    "hydrid_rrf_search_instructor_llmnode_687_system_0": "@prompts/hydrid-rrf-search_instructor-llmnode-687_system_0.md",
    "hydrid_rrf_search_instructor_llmnode_687_user_1": "@prompts/hydrid-rrf-search_instructor-llmnode-687_user_1.md"
  },
  "modelConfigs": {
    "hydrid_rrf_search_hybrid_search_node_957_embedding_model_name": "@model-configs/hydrid-rrf-search_hybrid-search-node-957_embedding-model-name.ts",
    "hydrid_rrf_search_instructor_llmnode_687_generative_model_name": "@model-configs/hydrid-rrf-search_instructor-llmnode-687_generative-model-name.ts"
  },
  "scripts": {
    "hydrid_rrf_search_code_node_861_code": "@scripts/hydrid-rrf-search_code-node-861_code.ts",
    "hydrid_rrf_search_code_node_933_code": "@scripts/hydrid-rrf-search_code-node-933_code.ts"
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
    "id": "codeNode_861",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/hydrid-rrf-search_code-node-861_code.ts",
        "nodeName": "Code"
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
        "vectorDB": "hybridRRFranking",
        "certainty": "0",
        "fusionType": "rankedFusion",
        "searchQuery": "{{codeNode_861.output}}",
        "boostProperties": false,
        "embeddingModelName": "@model-configs/hydrid-rrf-search_hybrid-search-node-957_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_933",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/hydrid-rrf-search_code-node-933_code.ts",
        "nodeName": "Code"
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
            "content": "@prompts/hydrid-rrf-search_instructor-llmnode-687_system_0.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/hydrid-rrf-search_instructor-llmnode-687_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/hydrid-rrf-search_instructor-llmnode-687_generative-model-name.ts"
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
    "id": "triggerNode_1-codeNode_861",
    "source": "triggerNode_1",
    "target": "codeNode_861",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_861-hybridSearchNode_957",
    "source": "codeNode_861",
    "target": "hybridSearchNode_957",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "hybridSearchNode_957-codeNode_933",
    "source": "hybridSearchNode_957",
    "target": "codeNode_933",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_933-InstructorLLMNode_687",
    "source": "codeNode_933",
    "target": "InstructorLLMNode_687",
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
