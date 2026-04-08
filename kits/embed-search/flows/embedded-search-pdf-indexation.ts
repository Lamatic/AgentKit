// Flow: embedded-search-pdf-indexation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "1A. Embedded Search - PDF Indexation",
  "description": "",
  "tags": [],
  "testInput": {
    "title": "Sample Resume",
    "url": "https://aseskssykbhhiborrwws.supabase.co/storage/v1/object/public/alpha/DhruvP_Resume.pdf"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "vectorizeNode_639": [
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
  "IndexNode_622": [
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
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "triggers": {
    "embedded_search_pdf_indexation_api_request": "@triggers/webhooks/embedded-search-pdf-indexation_api-request.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "extractFromFileNode_944",
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "id": "extractFromFileNode_944",
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract from File",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": true,
        "ignoreEmpty": false,
        "returnRawText": false,
        "encodeAsBase64": false,
        "discardUnmappedColumns": false
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_315",
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_315",
        "code": "output = {{extractFromFileNode_944.output.files}}[0]['data'][0]",
        "nodeName": "Extract Text"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 450
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "chunkNode_318",
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_318",
        "nodeName": "Chunking",
        "chunkField": "{{codeNode_315.output}}",
        "numOfChars": 500,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_254",
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_254",
        "code": "let docs =  {{chunkNode_318.output.chunks}}\n\nlet outputDocs = docs.map(doc => doc.pageContent);\nconsole.log(outputDocs)\noutput = outputDocs;",
        "nodeName": "Get Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 750
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "vectorizeNode_639",
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_639",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_254.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 900
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_507",
    "data": {
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_507",
        "code": "let vectors = {{vectorizeNode_639.output.vectors}}\nlet metadataProps = [];\nlet texts = {{codeNode_254.output}};\n\nfor (const idx in vectors) {\n    let metadata = {}\n    metadata[\"content\"] = texts[idx];\n    metadata[\"title\"] = {{variablesNode_954.output.title}};\n    metadata[\"source\"] = {{variablesNode_954.output.source}};\n    metadataProps.push(metadata);\n}\n\noutput = {\"metadata\": metadataProps, \"vectors\": vectors}",
        "nodeName": "Transform Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1050
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "IndexNode_622",
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "id": "IndexNode_622",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "title"
        ],
        "vectorsField": "{{vectorizeNode_639.output.vectors}}",
        "metadataField": "{{codeNode_507.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1200
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "variablesNode_954",
    "data": {
      "nodeId": "variablesNode",
      "values": {
        "id": "variablesNode_954",
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.title}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.url}}\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 150
    },
    "selected": false,
    "draggable": false
  },
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/embedded-search-pdf-indexation_api-request.ts",
        "advance_schema": "@triggers/webhooks/embedded-search-pdf-indexation_api-request.ts"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"status\": \"{{IndexNode_622.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1350
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "variablesNode_954-extractFromFileNode_944",
    "type": "defaultEdge",
    "source": "variablesNode_954",
    "target": "extractFromFileNode_944",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "extractFromFileNode_944-codeNode_315",
    "type": "defaultEdge",
    "source": "extractFromFileNode_944",
    "target": "codeNode_315",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_315-chunkNode_318",
    "type": "defaultEdge",
    "source": "codeNode_315",
    "target": "chunkNode_318",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_318-codeNode_254",
    "type": "defaultEdge",
    "source": "chunkNode_318",
    "target": "codeNode_254",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_254-vectorizeNode_639",
    "type": "defaultEdge",
    "source": "codeNode_254",
    "target": "vectorizeNode_639",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_639-codeNode_507",
    "type": "defaultEdge",
    "source": "vectorizeNode_639",
    "target": "codeNode_507",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_507-IndexNode_622",
    "type": "defaultEdge",
    "source": "codeNode_507",
    "target": "IndexNode_622",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-variablesNode_954",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_954",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "IndexNode_622-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "IndexNode_622",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
