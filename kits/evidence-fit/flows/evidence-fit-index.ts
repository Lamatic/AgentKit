// Flow: evidence-fit-index

// -- Meta --
export const meta = {
  "name": "evidence-fit-index",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naman Gupta",
    "email": "namanguptabhopal@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "vectorizeNode_3": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_4": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "evidence_fit_index_vectorize_node_3_embedding_model_name": "@model-configs/evidence-fit-index_vectorize-node-3_embedding-model-name.ts"
  },
  "scripts": {
    "evidence_fit_index_code_node_2_code": "@scripts/evidence-fit-index_code-node-2_code.ts"
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
        "advance_schema": "{\"experimentId\":\"string\",\"documentId\":\"string\",\"documentText\":\"string\",\"strategy\":\"string\"}"
      }
    }
  },
  {
    "id": "codeNode_2",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_2",
        "code": "@scripts/evidence-fit-index_code-node-2_code.ts",
        "nodeName": "Prepare Chunks"
      }
    }
  },
  {
    "id": "vectorizeNode_3",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_3",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_2.output.texts}}",
        "embeddingModelName": "@model-configs/evidence-fit-index_vectorize-node-3_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_4",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_4",
        "limit": 20,
        "action": "index",
        "filters": "",
        "nodeName": "Index",
        "vectorDB": "EvidenceFit",
        "primaryKeys": [
          "experimentId",
          "documentId",
          "strategy",
          "chunkId"
        ],
        "vectorsField": "{{vectorizeNode_3.output.vectors}}",
        "metadataField": "{{codeNode_2.output.metadata}}",
        "duplicateOperation": "overwrite"
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
        "nodeName": "API Response",
        "outputMapping": "{\n  \"ok\": \"{{codeNode_2.output.ok}}\",\n  \"indexedCount\": \"{{vectorNode_4.output.recordsIndexed}}\",\n  \"issues\": \"{{codeNode_2.output.issues}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_2",
    "source": "triggerNode_1",
    "target": "codeNode_2",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_2-vectorizeNode_3",
    "source": "codeNode_2",
    "target": "vectorizeNode_3",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_3-vectorNode_4",
    "source": "vectorizeNode_3",
    "target": "vectorNode_4",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_4-responseNode_triggerNode_1",
    "source": "vectorNode_4",
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
