// Flow: catalog-indexer

// -- Meta --
export const meta = {
  "name": "Catalog-indexer",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Harshit Gupta",
    "email": "harshit.105418@stu.upes.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "vectorizeNode_510": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "vectorNode_381": [
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
    "catalog_indexer_vectorize_node_510_embedding_model_name": "@model-configs/catalog-indexer_vectorize-node-510_embedding-model-name.ts"
  },
  "scripts": {
    "catalog_indexer_code_node_466_code": "@scripts/catalog-indexer_code-node-466_code.ts",
    "catalog_indexer_code_node_723_code": "@scripts/catalog-indexer_code-node-723_code.ts"
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
      "nodeId": "webhookTriggerNode",
      "trigger": true,
      "values": {
        "nodeName": "Webhook"
      }
    }
  },
  {
    "id": "codeNode_466",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/catalog-indexer_code-node-466_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_510",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_510",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_466.output}}",
        "embeddingModelName": "@model-configs/catalog-indexer_vectorize-node-510_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_723",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/catalog-indexer_code-node-723_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorNode_381",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_381",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "kiranacatalogv3",
        "primaryKeys": [
          "text"
        ],
        "vectorsField": "{{codeNode_723.output.vectors_json}}",
        "metadataField": "{{codeNode_723.output.metadata_json}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_507537",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_466-297",
    "source": "triggerNode_1",
    "target": "codeNode_466",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_466-vectorizeNode_510-640",
    "source": "codeNode_466",
    "target": "vectorizeNode_510",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_510-codeNode_723-894",
    "source": "vectorizeNode_510",
    "target": "codeNode_723",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_723-vectorNode_381-209",
    "source": "codeNode_723",
    "target": "vectorNode_381",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_381-plus-node-addNode_507537-133",
    "source": "vectorNode_381",
    "target": "plus-node-addNode_507537",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
