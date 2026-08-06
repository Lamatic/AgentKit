/**
 * ============================================================================
 * FLOW 01: DATA INGESTION & VECTOR INDEXING (THE SETUP)
 * ============================================================================
 * 
 * Architecture Overview:
 * This synchronous GraphQL flow seeds internal SRE engineering runbooks into
 * Lamatic's managed Vector Database for downstream semantic retrieval (RAG).
 *
 * Pipeline Lifecycle:
 * 1. triggerNode_1: Accepts GraphQL mutation with `contents` (raw markdown text)
 *    and optional document `metadata`.
 * 2. chunkNode_763: Recursively splits text into 2,000-character semantic chunks
 *    with 200-character overlap (`recursiveCharacterTextSplitter`).
 * 3. vectorizeNode_1: Computes high-dimensional dense embeddings for each chunk
 *    using Gemini embedding models configured via Lamatic ModelConfigs.
 * 4. vectorNode_333: Indexes the vectorized chunks + metadata into Lamatic VectorDB
 *    collection (`runbook`), overwriting existing records by primary key (`runbook_id`).
 * 5. responseNode_triggerNode_1: Returns structured JSON response confirming
 *    successful Vector DB synchronization.
 * ============================================================================
 */

// Flow: flow-1-data-ingestion-the-setup

// -- Meta --
export const meta = {
  "name": "Flow 1 Data Ingestion The Setup",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Nikhil Rajput",
    "email": "rajputnik911@gmail.com"
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
  "vectorNode_333": [
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
    "flow_1_data_ingestion_the_setup_vectorize_node_1_embedding_model_name": "@model-configs/flow-1-data-ingestion-the-setup_vectorize-node-1_embedding-model-name.ts"
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
        "nodeName": "Initialize System & Load Runbook",
        "responeType": "realtime",
        "advance_schema": "{\n  \"contents\": \"[string]\",\n  \"metadata\": [\n    {}\n  ]\n}"
      }
    }
  },
  {
    "id": "chunkNode_763",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_763",
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.contents}}",
        "numOfChars": 2000,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 200
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
        "nodeName": "Vectorize Chunks",
        "inputText": "{{triggerNode_1.output.contents}}",
        "embeddingModelName": "@model-configs/flow-1-data-ingestion-the-setup_vectorize-node-1_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "vectorNode_333",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_333",
        "limit": 3,
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "runbook",
        "primaryKeys": [
          "runbook_id"
        ],
        "dataTypeInfo": {
          "vectors": "array of arrays of numbers",
          "metadata": "object"
        },
        "vectorsField": "{{vectorizeNode_1.output.vectors}}",
        "metadataField": "{{triggerNode_1.output.metadata}}",
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
        "headers": "{\"content-type\": \"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\"status\": \"success\", \"message\": \"Vector DB Synced Successfully\"}"
      }
    }
  }
];

export const edges = [
  {
    "id": "vectorizeNode_1-vectorNode_333",
    "source": "vectorizeNode_1",
    "target": "vectorNode_333",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "xy-edge__vectorNode_333bottom-responseNode_triggerNode_1from-trigger",
    "source": "vectorNode_333",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-chunkNode_763",
    "source": "triggerNode_1",
    "target": "chunkNode_763",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_763-vectorizeNode_1",
    "source": "chunkNode_763",
    "target": "vectorizeNode_1",
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
