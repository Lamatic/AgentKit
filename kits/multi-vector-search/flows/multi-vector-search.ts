// Flow: multi-vector-search

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Multi Vector Search",
  "description": "This flow integrates vector search into your website, allowing you to combine results from multiple vector databases and run parallel searches. It then consolidates the results and returns them to users.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/multi-vector-search",
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
  "scripts": {
    "multi_vector_search_combine_results": "@scripts/multi-vector-search_combine-results.ts"
  },
  "triggers": {
    "multi_vector_search_searchbar": "@triggers/widgets/multi-vector-search_searchbar.ts"
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
        "nodeName": "SearchBar",
        "domains": "@triggers/widgets/multi-vector-search_searchbar.ts"
      }
    }
  },
  {
    "id": "codeNode_156",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Combine Results",
        "code": "@scripts/multi-vector-search_combine-results.ts"
      }
    }
  },
  {
    "id": "branchNode_805",
    "type": "branchNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "branchNode",
      "values": {
        "nodeName": "Branching",
        "branches": [
          {
            "label": "Branch 1",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj202"
          },
          {
            "label": "Branch 2",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj504"
          },
          {
            "label": "Branch 3",
            "value": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj615"
          }
        ]
      }
    }
  },
  {
    "id": "addNode_517",
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
    "id": "addNode_615",
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
    "id": "addNode_418",
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
    "id": "addNode_627",
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
    "id": "addNode_801",
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
    "id": "addNode_475",
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
    "id": "addNode_677",
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
    "id": "searchNode_147",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".9",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchNode_549",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".9",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchNode_795",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "searchNode",
      "values": {
        "nodeName": "Vector Search",
        "limit": "10",
        "vectorDB": "",
        "certainty": ".8",
        "searchQuery": "{{triggerNode_1.output.searchQuery}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "searchResponseNode_353",
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
        "title": "{{codeNode_156.output.results[:].title}}",
        "content": "{{codeNode_156.output.results[:].content}}",
        "breadcrumpsField": ""
      }
    }
  }
];

export const edges = [
  {
    "id": "addNode_517-codeNode_156",
    "source": "addNode_517",
    "target": "codeNode_156",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-branchNode_805",
    "source": "triggerNode_1",
    "target": "branchNode_805",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj202",
    "source": "branchNode_805",
    "target": "addNode_801",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 1"
    },
    "type": "branchEdge"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj504",
    "source": "branchNode_805",
    "target": "addNode_475",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 2"
    },
    "type": "branchEdge"
  },
  {
    "id": "branch-searchTriggerNode_don2yzs3tj-plus-node-branch-searchTriggerNode_don2yzs3tj615",
    "source": "branchNode_805",
    "target": "addNode_677",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "branchName": "Branch 3"
    },
    "type": "branchEdge"
  },
  {
    "id": "addNode_615-addNode_517",
    "source": "addNode_615",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_418-addNode_517",
    "source": "addNode_418",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_627-addNode_517",
    "source": "addNode_627",
    "target": "addNode_517",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_147-addNode_615",
    "source": "searchNode_147",
    "target": "addNode_615",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_549-addNode_418",
    "source": "searchNode_549",
    "target": "addNode_418",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "searchNode_795-addNode_627",
    "source": "searchNode_795",
    "target": "addNode_627",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_801-searchNode_147",
    "source": "addNode_801",
    "target": "searchNode_147",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_475-searchNode_549",
    "source": "addNode_475",
    "target": "searchNode_549",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_677-searchNode_795",
    "source": "addNode_677",
    "target": "searchNode_795",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_156-searchResponseNode_353",
    "source": "codeNode_156",
    "target": "searchResponseNode_353",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-searchResponseNode_353",
    "source": "triggerNode_1",
    "target": "searchResponseNode_353",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
