/*
 * # Document Parsing - Agent Kit
 * This flow ingests a document from a URL, derives a structured extraction schema from the provided instructions, chunks and embeds the document, and indexes enriched metadata into a vector database as the ingestion stage of the wider document-to-RAG system.
 */

// Flow: document-parsing-etl

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Document Parsing - Agent Kit",
  "description": "",
  "tags": [],
  "testInput": {
    "instructions": "summary and description as strings, and keywords as a collection of strings",
    "document_url": "https://aseskssykbhhiborrwws.supabase.co/storage/v1/object/public/alpha/DhruvP_Resume.pdf"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "LLMNode_570": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "modelType": "generator/text",
      "mode": "chat",
      "description": "Select the model to generate text based on the prompt.",
      "required": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "isPrivate": true
    }
  ],
  "vectorizeNode_697": [
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
  "InstructorLLMNode_664": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model",
      "mode": "instructor",
      "description": "Select the model to generate text based on the prompt.",
      "modelType": "generator/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": [
        {
          "configName": "configA",
          "type": "generator/text",
          "provider_name": "",
          "credential_name": "",
          "params": {}
        }
      ],
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "vectorNode_384": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "description": "Select the vector database where the action will be performed."
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
  "prompts": {
    "document_parsing_etl_generate_requirements_system": "@prompts/document-parsing-etl_generate-requirements_system.md",
    "document_parsing_etl_generate_requirements_user": "@prompts/document-parsing-etl_generate-requirements_user.md",
    "document_parsing_etl_generate_json_system": "@prompts/document-parsing-etl_generate-json_system.md",
    "document_parsing_etl_generate_json_user": "@prompts/document-parsing-etl_generate-json_user.md"
  },
  "scripts": {
    "document_parsing_etl_collate_document_pages": "@scripts/document-parsing-etl_collate-document-pages.ts",
    "document_parsing_etl_parse_json": "@scripts/document-parsing-etl_parse-json.ts",
    "document_parsing_etl_extract_chunks": "@scripts/document-parsing-etl_extract-chunks.ts",
    "document_parsing_etl_transform_metadata": "@scripts/document-parsing-etl_transform-metadata.ts"
  },
  "modelConfigs": {
    "document_parsing_etl_generate_requirements": "@model-configs/document-parsing-etl_generate-requirements.ts",
    "document_parsing_etl_generate_json": "@model-configs/document-parsing-etl_generate-json.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "branchNode_788",
    "data": {
      "label": "Branch",
      "modes": [],
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_788-addNode_215"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_788-addNode_760"
          }
        ],
        "nodeName": "Branching"
      }
    },
    "type": "branchNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 150
    }
  },
  {
    "id": "extractFromFileNode_736",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "extractFromFileNode",
      "values": {
        "trim": false,
        "ltrim": false,
        "quote": "\"",
        "rtrim": false,
        "format": "pdf",
        "comment": "null",
        "fileUrl": "{{triggerNode_1.output.document_url}}",
        "headers": true,
        "maxRows": "0",
        "encoding": "utf8",
        "nodeName": "Extract from File",
        "password": "",
        "skipRows": "0",
        "delimiter": ",",
        "joinPages": false,
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
      "x": 450,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "codeNode_179",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-parsing-etl_collate-document-pages.ts",
        "nodeName": "Collate Document Pages"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "LLMNode_570",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "LLMNode",
      "values": {
        "tools": [],
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/document-parsing-etl_generate-requirements_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/document-parsing-etl_generate-requirements_user.md"
          }
        ],
        "memories": "@model-configs/document-parsing-etl_generate-requirements.ts",
        "messages": "@model-configs/document-parsing-etl_generate-requirements.ts",
        "nodeName": "Generate Requirements",
        "attachments": "@model-configs/document-parsing-etl_generate-requirements.ts",
        "credentials": "@model-configs/document-parsing-etl_generate-requirements.ts",
        "generativeModelName": "@model-configs/document-parsing-etl_generate-requirements.ts"
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
    "selected": false
  },
  {
    "id": "codeNode_109",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-parsing-etl_parse-json.ts",
        "nodeName": "Parse JSON"
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
    "selected": false
  },
  {
    "id": "forLoopNode_180",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Loop",
        "increment": "1",
        "connectedTo": "forLoopEndNode_937",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{codeNode_179.output}}"
      }
    },
    "type": "forLoopNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "chunkNode_399",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{forLoopNode_180.output.currentValue}}",
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
      "x": 225,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "codeNode_602",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-parsing-etl_extract-chunks.ts",
        "nodeName": "Extract Chunks"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "vectorizeNode_697",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_602.output}}",
        "embeddingModelName": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "InstructorLLMNode_664",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{{codeNode_109.output}}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/document-parsing-etl_generate-json_system.md"
          },
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7d",
            "role": "user",
            "content": "@prompts/document-parsing-etl_generate-json_user.md"
          }
        ],
        "memories": "@model-configs/document-parsing-etl_generate-json.ts",
        "messages": "@model-configs/document-parsing-etl_generate-json.ts",
        "nodeName": "Generate JSON",
        "attachments": "@model-configs/document-parsing-etl_generate-json.ts",
        "generativeModelName": "@model-configs/document-parsing-etl_generate-json.ts"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1200
    },
    "selected": false
  },
  {
    "id": "codeNode_126",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/document-parsing-etl_transform-metadata.ts",
        "nodeName": "Transform Metadata"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1350
    },
    "selected": true
  },
  {
    "id": "vectorNode_384",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "vectorNode",
      "values": {
        "limit": 20,
        "action": "index",
        "filters": "",
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": [
          "uuid"
        ],
        "vectorsField": "{{vectorizeNode_697.output.vectors}}",
        "metadataField": "{{codeNode_126.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1500
    },
    "selected": false
  },
  {
    "id": "forLoopEndNode_937",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_180"
      }
    },
    "type": "forLoopEndNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1650
    }
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
        "outputMapping": "{\n  \"answer\": \"Document Parsed as per Instructions\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 1800
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-branchNode_788",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "branchNode_788",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_788-extractFromFileNode_736-377",
    "data": {
      "condition": "Branch 1",
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_788",
    "target": "extractFromFileNode_736",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_788-LLMNode_570-973",
    "data": {
      "condition": "Branch 2",
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_788",
    "target": "LLMNode_570",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "LLMNode_570-codeNode_109",
    "type": "defaultEdge",
    "source": "LLMNode_570",
    "target": "codeNode_109",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "extractFromFileNode_736-codeNode_179",
    "type": "defaultEdge",
    "source": "extractFromFileNode_736",
    "target": "codeNode_179",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_109-forLoopNode_180-800",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_109",
    "target": "forLoopNode_180",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_179-forLoopNode_180-524",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_179",
    "target": "forLoopNode_180",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_937-responseNode_triggerNode_1-471",
    "type": "defaultEdge",
    "source": "forLoopEndNode_937",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_180-chunkNode_399-338",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_180",
    "target": "chunkNode_399",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "chunkNode_399-codeNode_602",
    "type": "defaultEdge",
    "source": "chunkNode_399",
    "target": "codeNode_602",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_602-vectorizeNode_697",
    "type": "defaultEdge",
    "source": "codeNode_602",
    "target": "vectorizeNode_697",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_126-vectorNode_384",
    "type": "defaultEdge",
    "source": "codeNode_126",
    "target": "vectorNode_384",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorNode_384-forLoopEndNode_937",
    "type": "defaultEdge",
    "source": "vectorNode_384",
    "target": "forLoopEndNode_937",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "vectorizeNode_697-InstructorLLMNode_664",
    "type": "defaultEdge",
    "source": "vectorizeNode_697",
    "target": "InstructorLLMNode_664",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_664-codeNode_126",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_664",
    "target": "codeNode_126",
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
  },
  {
    "id": "forLoopNode_180-forLoopEndNode_937-756",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_180",
    "target": "forLoopEndNode_937",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_937-forLoopNode_180-551",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_937",
    "target": "forLoopNode_180",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
