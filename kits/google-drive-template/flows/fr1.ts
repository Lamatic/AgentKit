// Flow: fr1

// -- Meta --
export const meta = {
  "name": "Google Drive Template",
  "description": "Syncs files from a Google Drive folder, chunks and embeds their content, and indexes the vectors into a vector database to power a continuously updated RAG knowledge base.",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Akshat Virmani",
    "email": "akshatv@lamatic.ai"
  }
};

// -- Inputs --
export const inputs = {
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Google Drive authentication. Required to access the Google Drive API.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "folderUrl",
      "type": "resourceLocator",
      "label": "Folder",
      "modes": [
        {
          "name": "list",
          "type": "select",
          "label": "From List",
          "required": true,
          "defaultValue": ""
        },
        {
          "name": "url",
          "type": "text",
          "label": "By URL",
          "required": true,
          "defaultValue": ""
        }
      ],
      "required": true,
      "isPrivate": true,
      "typeOptions": {
        "loadOptionsMethod": "getFolders"
      },
      "airbyteInputName": "source/configuration.folder_url",
      "defaultModeValue": {
        "mode": "list",
        "value": ""
      }
    }
  ],
  "vectorizeNode_839": [
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "description": "Select the model to convert the texts into vector representations.",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
    }
  ],
  "vectorNode_951": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database where the vectors will be indexed.",
      "defaultValue": ""
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "modelConfigs": {
    "fr1_vectorize_node_839_embedding_model_name": "@model-configs/fr1_vectorize-node-839_embedding-model-name.ts"
  },
  "scripts": {
    "fr1_code_node_173_code": "@scripts/fr1_code-node-173_code.ts",
    "fr1_code_node_138_code": "@scripts/fr1_code-node-138_code.ts"
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
      "nodeId": "googleDriveNode",
      "trigger": true,
      "modes": {
        "folderUrl": "list"
      },
      "values": {
        "id": "triggerNode_1",
        "globs": [
          "**"
        ],
        "nodeName": "Google Drive",
        "syncMode": "full_refresh_append",
        "folderUrl": "https://drive.google.com/drive/folders/1AoVXfHTuR4es6R4a9gS1sl6bPDUUo5Ap",
        "credentials": "Google Drive OAuth 2",
        "cronExpression": "0 0 */6 ? * * UTC"
      }
    }
  },
  {
    "id": "chunkNode_411",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "id": "chunkNode_411",
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.content}}",
        "numOfChars": 1000,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 100
      }
    }
  },
  {
    "id": "codeNode_173",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/fr1_code-node-173_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorizeNode_839",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "id": "vectorizeNode_839",
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_173.output}}",
        "embeddingModelName": "@model-configs/fr1_vectorize-node-839_embedding-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_138",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/fr1_code-node-138_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "vectorNode_951",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_951",
        "limit": "3",
        "action": "index",
        "filters": "",
        "nodeName": "VectorDB",
        "vectorDB": "trl2",
        "primaryKeys": [
          "file_id"
        ],
        "vectorsField": "{{codeNode_138.output.vectors}}",
        "metadataField": "{{codeNode_138.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_754201",
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
    "id": "triggerNode_1-chunkNode_411",
    "source": "triggerNode_1",
    "target": "chunkNode_411",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_411-codeNode_173",
    "source": "chunkNode_411",
    "target": "codeNode_173",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_173-vectorizeNode_839",
    "source": "codeNode_173",
    "target": "vectorizeNode_839",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_839-codeNode_138",
    "source": "vectorizeNode_839",
    "target": "codeNode_138",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_138-vectorNode_951",
    "source": "codeNode_138",
    "target": "vectorNode_951",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_951-plus-node-addNode_754201",
    "source": "vectorNode_951",
    "target": "plus-node-addNode_754201",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
