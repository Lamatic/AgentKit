// Flow: data-ingestion

// -- Meta --
export const meta = {
  "name": "Data Ingestion",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Dhruv Bakshi",
    "email": "dhruvbakshi0803@gmail.com",
  },
};

// -- Inputs --
export const inputs = {
  "vectorizeNode_850": [
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
    },
  ],
  "vectorNode_843": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
    },
  ],
  "vectorNode_851": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
    },
  ],
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md",
  },
  "modelConfigs": {
    "data_ingestion_vectorize_node_850_embedding_model_name":
      "@model-configs/data-ingestion_vectorize-node-850_embedding-model-name.ts",
  },
  "scripts": {
    "data_ingestion_code_node_561_code":
      "@scripts/data-ingestion_code-node-561_code.ts",
    "data_ingestion_code_node_281_code":
      "@scripts/data-ingestion_code-node-281_code.ts",
    "data_ingestion_code_node_869_code":
      "@scripts/data-ingestion_code-node-869_code.ts",
  },
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema":
          '{\n  "documentName": "string",\n  "brand": "string",\n  "category": "string",\n  "content": "string"\n}',
      },
    },
  },
  {
    "id": "extractFromFileNode_996",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "id": "extractFromFileNode_996",
        "trim": false,
        "ltrim": false,
        "quote": '"',
        "rtrim": false,
        "format": "auto",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.content}}",
        "headers": false,
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
        "discardUnmappedColumns": false,
      },
    },
  },
  {
    "id": "codeNode_561",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/data-ingestion_code-node-561_code.ts",
        "nodeName": "Raw Text Code",
      },
    },
  },
  {
    "id": "chunkNode_419",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_419",
        "nodeName": "Chunking",
        "chunkField": "{{codeNode_561.output}}",
        "numOfChars": 400,
        "separators": ["\n\n", "\n", ""],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 150,
      },
    },
  },
  {
    "id": "codeNode_281",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/data-ingestion_code-node-281_code.ts",
        "nodeName": "Code",
      },
    },
  },
  {
    "id": "vectorizeNode_850",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_850",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_281.output}}",
        "embeddingModelName":
          "@model-configs/data-ingestion_vectorize-node-850_embedding-model-name.ts",
      },
    },
  },
  {
    "id": "codeNode_869",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/data-ingestion_code-node-869_code.ts",
        "nodeName": "Code",
      },
    },
  },
  {
    "id": "vectorNode_843",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_843",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB Index",
        "vectorDB": "ReturnPolicyStore",
        "primaryKeys": ["chunkId"],
        "vectorsField": "{{vectorizeNode_850.output.vectors}}",
        "metadataField": "{{codeNode_869.output.1}}",
        "duplicateOperation": "overwrite",
      },
    },
  },
  {
    "id": "vectorNode_851",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_851",
        "limit": "3",
        "action": "delete",
        "filters":
          '{\n  "operator": "And",\n  "operands": [\n    {\n      "path": [\n        "brand"\n      ],\n      "operator": "Equal",\n      "valueText": "{{triggerNode_1.output.brand}}"\n    },\n    {\n      "path": [\n        "category"\n      ],\n      "operator": "Equal",\n      "valueText": "{{triggerNode_1.output.category}}"\n    },\n    {\n      "path": [\n        "documentName"\n      ],\n      "operator": "Equal",\n      "valueText": "{{triggerNode_1.output.documentName}}"\n    },\n    {\n      "path": [\n        "version"\n      ],\n      "operator": "NotEqual",\n      "valueNumber": "{{codeNode_869.output.0}}"\n    }\n  ]\n}',
        "nodeName": "VectorDB Delete",
        "vectorDB": "ReturnPolicyStore",
        "primaryKeys": "",
        "vectorsField": "",
        "metadataField": "",
        "duplicateOperation": "overwrite",
      },
    },
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0,
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": '{"content-type":"application/json"}',
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping":
          '{\n  "success": "true",\n  "data": "File uploaded in vector store"\n}',
      },
    },
  },
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_996",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_996",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "chunkNode_419-codeNode_281",
    "source": "chunkNode_419",
    "target": "codeNode_281",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_281-vectorizeNode_850",
    "source": "codeNode_281",
    "target": "vectorizeNode_850",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "vectorizeNode_850-codeNode_869",
    "source": "vectorizeNode_850",
    "target": "codeNode_869",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_869-vectorNode_843",
    "source": "codeNode_869",
    "target": "vectorNode_843",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "vectorNode_843-vectorNode_851",
    "source": "vectorNode_843",
    "target": "vectorNode_851",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "vectorNode_851-responseNode_triggerNode_1",
    "source": "vectorNode_851",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "extractFromFileNode_996-codeNode_561",
    "source": "extractFromFileNode_996",
    "target": "codeNode_561",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "codeNode_561-chunkNode_419",
    "source": "codeNode_561",
    "target": "chunkNode_419",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge",
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
