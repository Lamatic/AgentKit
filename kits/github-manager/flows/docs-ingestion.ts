// Flow: docs-ingestion

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "DOCS Ingestion",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "scraperNode_823": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "description": "Select the credentials for scraper authentication.",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "vectorizeNode_295": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "description": "Select the model to convert the texts into vector representations.",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "IndexNode_824": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "description": "Select the vector database where the vectors will be indexed."
    }
  ]
};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "docs_ingestion_extract_chunks": "@scripts/docs-ingestion_extract-chunks.ts",
    "docs_ingestion_transform_metadata": "@scripts/docs-ingestion_transform-metadata.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "scraperNode_823",
    "data": {
      "logic": [],
      "nodeId": "scraperNode",
      "values": {
        "id": "scraperNode_823",
        "url": "{{triggerNode_1.output.url}}",
        "mobile": false,
        "timeout": "10000",
        "waitFor": "1000",
        "nodeName": "Scraper",
        "credentials": "",
        "excludeTags": [],
        "includeTags": [],
        "onlyMainContent": true,
        "skipTLsVerification": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 130
    },
    "selected": true
  },
  {
    "id": "chunkNode_770",
    "data": {
      "logic": [],
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_770",
        "nodeName": "Chunking",
        "chunkField": "{{scraperNode_823.output.markdown}}",
        "numOfChars": 500,
        "separators": [
          "\n\n",
          " ",
          "\\n"
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "codeNode_158",
    "data": {
      "logic": [],
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_158",
        "code": "@scripts/docs-ingestion_extract-chunks.ts",
        "nodeName": "Extract Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 390
    },
    "selected": false
  },
  {
    "id": "vectorizeNode_295",
    "data": {
      "logic": [],
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_295",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_158.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 520
    },
    "selected": false
  },
  {
    "id": "codeNode_512",
    "data": {
      "logic": [],
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/docs-ingestion_transform-metadata.ts",
        "nodeName": "Transform MetaData"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 650
    },
    "selected": false
  },
  {
    "id": "IndexNode_824",
    "data": {
      "logic": [],
      "nodeId": "IndexNode",
      "values": {
        "id": "IndexNode_824",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "[URL]+[chunkidx]"
        ],
        "vectorsField": "{{codeNode_512.output.vectors}}",
        "metadataField": "{{codeNode_512.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 780
    },
    "selected": false
  },
  {
    "id": "graphqlResponseNode_532",
    "data": {
      "logic": [],
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"message\": \"{{IndexNode_824.output.message}}\",\n  \"records\": \"{{IndexNode_824.output.recordsIndexed}}\"\n}"
      }
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 0,
      "y": 910
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-scraperNode_823",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "scraperNode_823",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "scraperNode_823-chunkNode_770",
    "type": "defaultEdge",
    "source": "scraperNode_823",
    "target": "chunkNode_770",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_770-codeNode_158",
    "type": "defaultEdge",
    "source": "chunkNode_770",
    "target": "codeNode_158",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_158-vectorizeNode_295",
    "type": "defaultEdge",
    "source": "codeNode_158",
    "target": "vectorizeNode_295",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_512-IndexNode_824",
    "type": "defaultEdge",
    "source": "codeNode_512",
    "target": "IndexNode_824",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_295-codeNode_512",
    "type": "defaultEdge",
    "source": "vectorizeNode_295",
    "target": "codeNode_512",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "IndexNode_824-graphqlResponseNode_532",
    "type": "defaultEdge",
    "source": "IndexNode_824",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-graphqlResponseNode_532",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
