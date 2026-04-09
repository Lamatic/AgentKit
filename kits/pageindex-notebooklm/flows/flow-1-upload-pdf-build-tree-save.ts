// Flow: flow-1-upload-pdf-build-tree-save

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Flow 1 Upload PDF Build Tree Save",
  "description": "Upload a PDF, build a tree index, and save to database.",
  "tags": [
    "upload",
    "pdf",
    "pageindex",
    "notebooklm"
  ],
  "testInput": "{}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "InstructorLLMNode_tree": [
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
    "flow_1_upload_pdf_build_tree_save_generate_tree_system": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_system.md",
    "flow_1_upload_pdf_build_tree_save_generate_tree_user": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_user.md"
  },
  "scripts": {
    "flow_1_upload_pdf_build_tree_save_code": "@scripts/flow-1-upload-pdf-build-tree-save_code.ts",
    "flow_1_upload_pdf_build_tree_save_format_pages": "@scripts/flow-1-upload-pdf-build-tree-save_format-pages.ts",
    "flow_1_upload_pdf_build_tree_save_save_to_supabase": "@scripts/flow-1-upload-pdf-build-tree-save_save-to-supabase.ts"
  },
  "modelConfigs": {
    "flow_1_upload_pdf_build_tree_save_generate_tree": "@model-configs/flow-1-upload-pdf-build-tree-save_generate-tree.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "schema": {
        "sampleOutput": "string"
      },
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"file_url\": \"string\",\n  \"file_name\": \"string\",\n  \"file_base64\": \"string\",\n  \"mime_type\": \"string\"\n}"
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
    "id": "codeNode_630",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "file_name": "string",
        "resolved_url": "string",
        "uploaded_to_storage": "boolean"
      },
      "values": {
        "id": "codeNode_630",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_code.ts",
        "nodeName": "Code"
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
    "id": "extractFromFileNode_1",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "extractFromFileNode",
      "schema": {
        "files": "object"
      },
      "values": {
        "id": "extractFromFileNode_1",
        "format": "pdf",
        "fileUrl": "{{codeNode_630.output.resolved_url}}",
        "nodeName": "Extract PDF",
        "joinPages": false,
        "operation": "extractFromPDF"
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
    "selected": false,
    "draggable": false
  },
  {
    "id": "codeNode_format",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "pages": "array",
        "raw_text": "string",
        "toc_items": "array",
        "page_count": "number",
        "pages_json": "string",
        "has_native_toc": "boolean"
      },
      "values": {
        "id": "codeNode_format",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_format-pages.ts",
        "nodeName": "Format Pages"
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
    "selected": false,
    "draggable": false
  },
  {
    "id": "InstructorLLMNode_tree",
    "data": {
      "modes": {},
      "nodeId": "InstructorLLMNode",
      "schema": {},
      "values": {
        "id": "InstructorLLMNode_tree",
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"tree\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"object\",\n        \"properties\": {\n          \"node_id\": {\n            \"type\": \"string\"\n          },\n          \"title\": {\n            \"type\": \"string\"\n          },\n          \"start_index\": {\n            \"type\": \"number\"\n          },\n          \"end_index\": {\n            \"type\": \"number\"\n          },\n          \"summary\": {\n            \"type\": \"string\"\n          },\n          \"nodes\": {\n            \"type\": \"array\",\n            \"items\": {\n              \"type\": \"string\"\n            }\n          }\n        },\n        \"additionalProperties\": true\n      }\n    },\n    \"tree_node_count\": {\n      \"type\": \"number\",\n      \"description\": \"Total number of nodes in the tree array\"\n    }\n  }\n}",
        "prompts": [
          {
            "role": "system",
            "content": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_system.md"
          },
          {
            "role": "user",
            "content": "@prompts/flow-1-upload-pdf-build-tree-save_generate-tree_user.md"
          }
        ],
        "nodeName": "Generate Tree",
        "generativeModelName": "@model-configs/flow-1-upload-pdf-build-tree-save_generate-tree.ts"
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
    "selected": false,
    "draggable": false
  },
  {
    "id": "variablesNode_617",
    "data": {
      "label": "dynamicNode node",
      "logic": [],
      "modes": {},
      "nodeId": "variablesNode",
      "schema": {},
      "values": {
        "id": "variablesNode_617",
        "mapping": "{\n  \"file_name\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.file_name}}\"\n  },\n  \"file_url\": {\n    \"type\": \"string\",\n    \"value\": \"{{triggerNode_1.output.file_url}}\"\n  },\n  \"tree\": {\n    \"type\": \"string\",\n    \"value\": \"{{InstructorLLMNode_tree.output.tree}}\"\n  },\n  \"raw_data\": {\n    \"type\": \"string\",\n    \"value\": \"{{extractFromFileNode_1.output.files}}\"\n  },\n  \"tree_node_count\": {\n    \"type\": \"number\",\n    \"value\": \"{{InstructorLLMNode_tree.output.tree_node_count}}\"\n  }\n}",
        "nodeName": "Variables"
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
    "id": "codeNode_save",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "schema": {
        "error": "null",
        "doc_id": "string",
        "status": "string",
        "success": "boolean",
        "file_name": "string",
        "status_code": "number",
        "response_text": "string",
        "tree_node_count": "number"
      },
      "values": {
        "id": "codeNode_save",
        "code": "@scripts/flow-1-upload-pdf-build-tree-save_save-to-supabase.ts",
        "nodeName": "Save to Supabase"
      },
      "disabled": false
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
    "selected": false,
    "draggable": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "modes": {},
      "nodeId": "graphqlResponseNode",
      "schema": {},
      "values": {
        "id": "responseNode_triggerNode_1",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"doc_id\": \"{{codeNode_save.output.doc_id}}\",\n  \"file_name\": \"{{codeNode_save.output.file_name}}\",\n  \"tree_node_count\": \"{{codeNode_save.output.tree_node_count}}\",\n  \"status\": \"{{codeNode_save.output.status}}\"\n}"
      },
      "disabled": false,
      "isResponseNode": true
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
    "id": "extractFromFileNode_1-codeNode_format",
    "type": "defaultEdge",
    "source": "extractFromFileNode_1",
    "target": "codeNode_format",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_format-InstructorLLMNode_tree",
    "type": "defaultEdge",
    "source": "codeNode_format",
    "target": "InstructorLLMNode_tree",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_save-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_save",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_617-codeNode_save",
    "type": "defaultEdge",
    "source": "variablesNode_617",
    "target": "codeNode_save",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "InstructorLLMNode_tree-variablesNode_617",
    "type": "defaultEdge",
    "source": "InstructorLLMNode_tree",
    "target": "variablesNode_617",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-codeNode_630",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "codeNode_630",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_630-extractFromFileNode_1",
    "type": "defaultEdge",
    "source": "codeNode_630",
    "target": "extractFromFileNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  }
];

export default { meta, inputs, references, nodes, edges };
