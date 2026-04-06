// Flow: onedrive
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Onedrive",
  "description": "Onedrive",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "IndexNode_622": [
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
  ],
  "triggerNode_1": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Onedrive authentication.",
      "defaultValue": "",
      "isCredential": true
    },
    {
      "name": "drive_name",
      "type": "text",
      "label": "Drive Name",
      "required": true,
      "isPrivate": true,
      "description": "Name of the Microsoft OneDrive drive where the file(s) exist. For most accounts, this is \"OneDrive\".",
      "defaultValue": "OneDrive",
      "airbyteInputName": "source/configuration.drive_name"
    },
    {
      "name": "folder_path",
      "type": "text",
      "label": "Folder Path",
      "required": true,
      "isPrivate": true,
      "description": "Path to a specific folder within the drives to search for files. Leave \".\" to search all folders of the drives. This does not apply to shared items. For a folder absolute path, use the format \"./FolderName/SubfolderName\"",
      "defaultValue": ".",
      "airbyteInputName": "source/configuration.folder_path"
    }
  ],
  "vectorizeNode_639": [
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
  ]
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md"
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
      "nodeId": "onedriveNode",
      "modes": {},
      "trigger": true,
      "values": {
        "nodeName": "Onedrive Business",
        "globs": [
          "**/*.pdf",
          "**/*.docx",
          "**/*.txt",
          "**/*.pptx",
          "**/*.md"
        ],
        "strategy": "auto",
        "syncMode": "incremental",
        "drive_name": "OneDrive",
        "start_date": "",
        "folder_path": ".",
        "search_scope": "ALL",
        "cronExpression": "0 0 00 ? * 1 * UTC",
        "days_to_sync_if_history_is_full": "3"
      }
    }
  },
  {
    "id": "chunkNode_318",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.content}}",
        "numOfChars": 500,
        "separators": [
          "\n\n",
          "\n",
          " "
        ],
        "chunkingType": "recursiveCharacterTextSplitter",
        "overlapChars": 50
      }
    }
  },
  {
    "id": "codeNode_254",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Get Chunks",
        "code": "let docs =  {{chunkNode_318.output.chunks}}\n\nlet outputDocs = docs.map(doc => doc.pageContent);\nconsole.log(outputDocs)\noutput = outputDocs;"
      }
    }
  },
  {
    "id": "vectorizeNode_639",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_254.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_507",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Transform Metadata",
        "code": "let vectors = {{vectorizeNode_639.output.vectors}}\nlet metadataProps = [];\nlet texts = {{codeNode_254.output}};\n\nfor (const idx in vectors) {\n    let metadata = {}\n    metadata[\"content\"] = texts[idx];\n    metadata[\"title\"] = {{variablesNode_289.output.title}};\n    metadata[\"source\"] = {{variablesNode_289.output.source}};\n    metadata[\"last_modified\"] = {{variablesNode_289.output.last_modified}};\n    \n    metadataProps.push(metadata);\n}\n\noutput = {\"metadata\": metadataProps, \"vectors\": vectors}"
      }
    }
  },
  {
    "id": "IndexNode_622",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index",
        "primaryKeys": [
          "file_name"
        ],
        "vectorsField": "{{vectorizeNode_639.output.vectors}}",
        "metadataField": "{{codeNode_507.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "plus-node-addNode_960424",
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
  },
  {
    "id": "variablesNode_289",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "variablesNode",
      "modes": {},
      "values": {
        "nodeName": "Variables",
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.document_key}}\"\n  },\n  \"last_modified\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output._ab_source_file_last_modified}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output._ab_source_file_url}}\"\n  }\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "variablesNode_289-chunkNode_318",
    "source": "variablesNode_289",
    "target": "chunkNode_318",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_318-codeNode_254",
    "source": "chunkNode_318",
    "target": "codeNode_254",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_254-vectorizeNode_639",
    "source": "codeNode_254",
    "target": "vectorizeNode_639",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_639-codeNode_507",
    "source": "vectorizeNode_639",
    "target": "codeNode_507",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_507-IndexNode_622",
    "source": "codeNode_507",
    "target": "IndexNode_622",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_622-plus-node-addNode_960424",
    "source": "IndexNode_622",
    "target": "plus-node-addNode_960424",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-variablesNode_289",
    "source": "triggerNode_1",
    "target": "variablesNode_289",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
