// Flow: semantic-search

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Semantic Search",
  "description": "Add Natural Language Search powered by your content across data sources",
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
  "searchNode_443": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "defaultValue": ""
    },
    {
      "mode": "embedding",
      "name": "embeddingModelName",
      "type": "model",
      "label": "Embedding Model Name",
      "required": true,
      "isPrivate": true,
      "modelType": "embedder/text",
      "typeOptions": {
        "loadOptionsMethod": "listModels"
      },
      "defaultValue": ""
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
    "semantic_search_collate_results": "@scripts/semantic-search_collate-results.ts"
  },
  "triggers": {
    "semantic_search_search_widget": "@triggers/widgets/semantic-search_search-widget.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchTriggerNode",
      "modes": {},
      "trigger": true,
      "values": {
        "domains": "@triggers/widgets/semantic-search_search-widget.ts",
        "nodeName": "Search Widget",
        "search": "",
        "searchConfig": "@triggers/widgets/semantic-search_search-widget.ts"
      }
    }
  },
  {
    "id": "searchNode_443",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "modes": {},
      "values": {
        "nodeName": "Vector Search",
        "limit": 10,
        "filters": "[]",
        "certainty": "0.5",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_913",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Collate Results",
        "code": "@scripts/semantic-search_collate-results.ts"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchResponseNode",
      "values": {
        "nodeName": "Search Response",
        "tab": "{{codeNode_913.output.results[:].type}}",
        "group": "",
        "title": "{{codeNode_913.output.results[:].title}}",
        "content": "{{codeNode_913.output.results[:].content}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-searchNode_443",
    "source": "triggerNode_1",
    "target": "searchNode_443",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_443-codeNode_913",
    "source": "searchNode_443",
    "target": "codeNode_913",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_913-responseNode_triggerNode_1",
    "source": "codeNode_913",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
