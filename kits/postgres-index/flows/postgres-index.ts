// Flow: postgres-index
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Postgres Index",
  "description": "This template indexes data from a PostgresDB, periodically running a cron job to check for new files. It helps teams set up automatic data pipelines from Postgres, vectorizing and indexing data to Lamatic.",
  "tags": [
    "🚀 Startup",
    "🛢️ Database"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/postgres-index",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "postgres_index_make_metadata_and_vectordata": "@scripts/postgres-index_make-metadata-and-vectordata.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "postgresNode",
      "trigger": true,
      "values": {
        "nodeName": "Postgres",
        "tables": "",
        "syncMode": "incremental_append",
        "credentials": "",
        "cronExpression": "0 0 00 1/1 * ? * UTC"
      }
    }
  },
  {
    "id": "codeNode_858",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Make MetaData and VectorData",
        "code": "@scripts/postgres-index_make-metadata-and-vectordata.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_738",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_858.output.vectorData}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "IndexNode_451",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index Translation",
        "vectorDB": "",
        "primaryKeys": "",
        "vectorsField": "{{vectorizeNode_738.output.vectors}}",
        "metadataField": "{{codeNode_858.output.MetaData}}",
        "duplicateOperation": "overwrite",
        "embeddingModelName": {},
        "generativeModelName": {}
      }
    }
  },
  {
    "id": "addNode_565",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {
        "nodeName": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-codeNode_858",
    "source": "triggerNode_1",
    "target": "codeNode_858",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_858-vectorizeNode_738",
    "source": "codeNode_858",
    "target": "vectorizeNode_738",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_738-IndexNode_451",
    "source": "vectorizeNode_738",
    "target": "IndexNode_451",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_451-addNode_565",
    "source": "IndexNode_451",
    "target": "addNode_565",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
