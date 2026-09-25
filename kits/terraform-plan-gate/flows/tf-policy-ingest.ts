// Flow: tf-policy-ingest

// -- Meta --
export const meta = {
  "name": "tf-policy-ingest",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Sarthak Bhardwaj",
    "email": "sarthak.bhardwaj21b@iiitg.ac.in"
  }
};

// -- Inputs --
export const inputs = {
  "vectorizeNode_1": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model"
    }
  ],
  "IndexNode_1": [
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
    "tf_policy_ingest_vectorize_node_1_embedding_model_name": "@model-configs/tf-policy-ingest_vectorize-node-1_embedding-model-name.ts",
    "tf_policy_ingest_index_node_1_embedding_model_name": "@model-configs/tf-policy-ingest_index-node-1_embedding-model-name.ts"
  },
  "scripts": {
    "tf_policy_ingest_code_node_1_code": "@scripts/tf-policy-ingest_code-node-1_code.ts"
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
        "responseType": "realtime",
        "advance_schema": "{\n  \"run\": \"string\",\n  \"policies\": \"[string]\"\n}"
      }
    }
  },
  {
    "id": "codeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_1",
        "code": "@scripts/tf-policy-ingest_code-node-1_code.ts",
        "nodeName": "Policy set"
      }
    }
  },
  {
    "id": "vectorizeNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_1",
        "nodeName": "Embed policies",
        "inputText": "{{codeNode_1.output.texts}}",
        "embeddingModelName": "@model-configs/tf-policy-ingest_vectorize-node-1_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "IndexNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "id": "IndexNode_1",
        "nodeName": "Index policies",
        "vectorDB": "tfpolicies",
        "primaryKeys": "[\"policy_id\"]",
        "vectorsField": "{{vectorizeNode_1.output.vectors}}",
        "metadataField": "{{codeNode_1.output.metadata}}",
        "duplicateOperation": "overwrite",
        "embeddingModelName": "@model-configs/tf-policy-ingest_index-node-1_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"indexed\": \"{{codeNode_1.output.texts.length}}\",\n  \"source\": \"{{codeNode_1.output.source}}\",\n  \"result\": \"{{IndexNode_1.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_1",
    "source": "triggerNode_1",
    "target": "codeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_1-vectorizeNode_1",
    "source": "codeNode_1",
    "target": "vectorizeNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_1-IndexNode_1",
    "source": "vectorizeNode_1",
    "target": "IndexNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_1-responseNode_triggerNode",
    "source": "IndexNode_1",
    "target": "responseNode_triggerNode",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
