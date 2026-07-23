// Flow: index-scam-patterns

// -- Meta --
export const meta = {
  "name": "index-scam-patterns",
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
  "vectorizeNode_808": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_954": [
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
    "index_scam_patterns_vectorize_node_808_embedding_model_name": "@model-configs/index-scam-patterns_vectorize-node-808_embedding-model-name.ts"
  },
  "scripts": {
    "index_scam_patterns_code_node_948_code": "@scripts/index-scam-patterns_code-node-948_code.ts"
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
        "advance_schema": "{\n  \"patterns\": [\n    {\n      \"pattern_name\": \"string\",\n      \"content\": \"string\"\n    }\n  ]\n}"
      }
    }
  },
  {
    "id": "codeNode_948",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/index-scam-patterns_code-node-948_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_808",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_808",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_948.output.vectorData}}",
        "embeddingModelName": "@model-configs/index-scam-patterns_vectorize-node-808_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_954",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_954",
        "limit": 20,
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "scampatterns",
        "primaryKeys": [
          "id"
        ],
        "vectorsField": "{{vectorizeNode_808.output.vectors}}",
        "metadataField": "{{codeNode_948.output.metaData}}",
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
        "outputMapping": "{ \"message\": \"{{vectorNode_954.output.message}}\", \"recordsIndexed\": \"{{vectorNode_954.output.recordsIndexed}}\" }"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_948",
    "source": "triggerNode_1",
    "target": "codeNode_948",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_948-vectorizeNode_808",
    "source": "codeNode_948",
    "target": "vectorizeNode_808",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_808-vectorNode_954",
    "source": "vectorizeNode_808",
    "target": "vectorNode_954",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_954-responseNode_triggerNode_1",
    "source": "vectorNode_954",
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