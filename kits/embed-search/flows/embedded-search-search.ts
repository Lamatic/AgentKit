// Flow: embedded-search-search

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "2. Embedded Search - Search",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {
  "searchNode_842": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      }
    }
  ],
  "searchNode_145": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select",
      "isDB": true,
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "name": "embeddingModelName",
      "label": "Embedding Model Name",
      "type": "model",
      "mode": "embedding",
      "modelType": "embedder/text",
      "required": true,
      "isPrivate": true,
      "defaultValue": "",
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
  "scripts": {
    "embedded_search_search_collate_results": "@scripts/embedded-search-search_collate-results.ts"
  },
  "triggers": {
    "embedded_search_search_search_widget": "@triggers/widgets/embedded-search-search_search-widget.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "searchTriggerNode",
      "values": {
        "search": "",
        "domains": "@triggers/widgets/embedded-search-search_search-widget.ts",
        "nodeName": "Search Widget",
        "searchConfig": "@triggers/widgets/embedded-search-search_search-widget.ts"
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
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "searchResponseNode",
      "values": {
        "tab": "",
        "link": "{{codeNode_913.output.results[:].type}}",
        "group": "",
        "title": "{{codeNode_913.output.results[:].title}}",
        "content": "{{codeNode_913.output.results[:].content}}",
        "nodeName": "Search Response",
        "referenceLink": "",
        "referenceText": "",
        "breadcrumpsField": ""
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
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_913",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/embedded-search-search_collate-results.ts",
        "nodeName": "Collate Results"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 225,
      "y": 450
    },
    "selected": true
  },
  {
    "id": "branchNode_437",
    "data": {
      "label": "Branch",
      "modes": [],
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_437-addNode_203"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_437-addNode_432"
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
    "id": "searchNode_842",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": 5,
        "filters": "[]",
        "nodeName": "PDF DB Search",
        "vectorDB": "",
        "certainty": "0.85",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
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
      "y": 300
    },
    "selected": false
  },
  {
    "id": "searchNode_145",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "searchNode",
      "values": {
        "limit": 5,
        "filters": "[]",
        "nodeName": "Website DB Search",
        "vectorDB": "",
        "certainty": "0.85",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": ""
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
  }
];

export const edges = [
  {
    "id": "codeNode_913-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_913",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-branchNode_437",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "branchNode_437",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_437-searchNode_842-654",
    "data": {
      "condition": "Branch 1",
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_437",
    "target": "searchNode_842",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_437-searchNode_145-519",
    "data": {
      "condition": "Branch 2",
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_437",
    "target": "searchNode_145",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_842-codeNode_913-817",
    "type": "defaultEdge",
    "source": "searchNode_842",
    "target": "codeNode_913",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "searchNode_145-codeNode_913-402",
    "type": "defaultEdge",
    "source": "searchNode_145",
    "target": "codeNode_913",
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
