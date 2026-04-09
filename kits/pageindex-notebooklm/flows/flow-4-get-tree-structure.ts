// Flow: flow-4-get-tree-structure
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Flow 4 Get Tree Structure",
  "description": "Retrieve the full hierarchical tree structure for a document or delete a document and its associated data from Supabase.",
  "tags": [
    "tree",
    "pageindex",
    "notebooklm",
    "document-management",
    "delete"
  ],
  "testInput": "{\"doc_id\": \"example-doc-id\", \"action\": \"get_tree\"}",
  "githubUrl": "https://github.com/Skt329/AgentKit",
  "documentationUrl": "https://github.com/Skt329/AgentKit",
  "deployUrl": "https://pageindex-notebooklm.vercel.app/"
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "postgresNode_113": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for postgres authentication.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ],
  "postgresNode_206": [
    {
      "name": "credentials",
      "label": "Credentials",
      "description": "Select the credentials for postgres authentication.",
      "type": "select",
      "isCredential": true,
      "required": true,
      "defaultValue": "",
      "isPrivate": true
    }
  ]
};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "flow_4_get_tree_structure_merge_response": "@scripts/flow-4-get-tree-structure_merge-response.ts"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"doc_id\": \"string\",\n  \"action\": \"string\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 0
    },
    "selected": true
  },
  {
    "id": "conditionNode_944",
    "data": {
      "label": "Condition",
      "modes": {},
      "nodeId": "conditionNode",
      "values": {
        "id": "conditionNode_944",
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_944-addNode_581",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{triggerNode_1.output.action}}\",\n      \"operator\": \"==\",\n      \"value\": \"get_tree\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_944-addNode_226",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    },
    "type": "conditionNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 130
    },
    "selected": false
  },
  {
    "id": "postgresNode_113",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_113",
        "query": "DELETE FROM documents WHERE doc_id = '{{triggerNode_1.output.doc_id}}' RETURNING doc_id, file_name;",
        "action": "runQuery",
        "nodeName": "Delete Document",
        "credentials": ""
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 450,
      "y": 260
    },
    "selected": false
  },
  {
    "id": "postgresNode_206",
    "data": {
      "label": "New",
      "logic": [],
      "modes": {},
      "nodeId": "postgresNode",
      "values": {
        "id": "postgresNode_206",
        "query": "SELECT tree, file_name, tree_node_count, created_at FROM documents WHERE doc_id = '{{triggerNode_1.output.doc_id}}' LIMIT 1;",
        "action": "runQuery",
        "nodeName": "Get Tree",
        "credentials": ""
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
    "id": "codeNode_merge",
    "data": {
      "logic": [],
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "id": "codeNode_merge",
        "code": "@scripts/flow-4-get-tree-structure_merge-response.ts",
        "nodeName": "Merge Response"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 390
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
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "nodeName": "API Response",
        "outputMapping": "{\n  \"success\": \"{{codeNode_merge.output.success}}\",\n  \"action\": \"{{codeNode_merge.output.action}}\",\n  \"message\": \"{{codeNode_merge.output.message}}\",\n  \"doc_id\": \"{{codeNode_merge.output.doc_id}}\",\n  \"tree\": \"{{codeNode_merge.output.tree}}\",\n  \"file_name\": \"{{codeNode_merge.output.file_name}}\",\n  \"tree_node_count\": \"{{codeNode_merge.output.tree_node_count}}\",\n  \"created_at\": \"{{codeNode_merge.output.created_at}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 216,
      "height": 93
    },
    "position": {
      "x": 225,
      "y": 520
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "codeNode_merge-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_merge",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_944-postgresNode_206",
    "data": {
      "condition": "Condition 1"
    },
    "type": "conditionEdge",
    "source": "conditionNode_944",
    "target": "postgresNode_206",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "conditionNode_944-postgresNode_113",
    "data": {
      "condition": "Else"
    },
    "type": "conditionEdge",
    "source": "conditionNode_944",
    "target": "postgresNode_113",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "postgresNode_206-codeNode_merge",
    "type": "defaultEdge",
    "source": "postgresNode_206",
    "target": "codeNode_merge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "postgresNode_113-codeNode_merge",
    "type": "defaultEdge",
    "source": "postgresNode_113",
    "target": "codeNode_merge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-conditionNode_944",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "conditionNode_944",
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
