// Flow: search-widget

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Search Widget",
  "description": "This flow builds a search widget that retrieves data from a vector database and a RAG Node, presenting the information in the ideal widget format.",
  "tags": [
    "📞 Support"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/search-widget",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "search_widget_rag_system": "@prompts/search-widget_rag_system.md"
  },
  "modelConfigs": {
    "search_widget_rag": "@model-configs/search-widget_rag.ts"
  },
  "triggers": {
    "search_widget_search_widget": "@triggers/widgets/search-widget_search-widget.ts"
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
      "trigger": true,
      "values": {
        "nodeName": "Search Widget",
        "search": "",
        "domains": "@triggers/widgets/search-widget_search-widget.ts"
      }
    }
  },
  {
    "id": "RAGNode_793",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/search-widget_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/search-widget_rag_system.md"
          }
        ],
        "memories": "@model-configs/search-widget_rag.ts",
        "messages": "@model-configs/search-widget_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/search-widget_rag.ts",
        "queryField": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": "@model-configs/search-widget_rag.ts",
        "generativeModelName": "@model-configs/search-widget_rag.ts"
      }
    }
  },
  {
    "id": "searchResponseNode_898",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchResponseNode",
      "values": {
        "nodeName": "Search Response",
        "link": "",
        "title": "{{RAGNode_793.output.references[:].filename}}",
        "content": "{{RAGNode_793.output.references[:].content}}",
        "breadcrumpsField": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-RAGNode_793",
    "source": "triggerNode_1",
    "target": "RAGNode_793",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_793-searchResponseNode_898",
    "source": "RAGNode_793",
    "target": "searchResponseNode_898",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-searchResponseNode_898",
    "source": "triggerNode_1",
    "target": "searchResponseNode_898",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
