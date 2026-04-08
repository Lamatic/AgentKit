// Flow: crawling-indexation

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Crawling Indexation",
  "description": "Crawling Indexation",
  "tags": [],
  "testInput": {
    "urls": [
      "https://lamatic.ai/docs"
    ]
  },
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
  "vectorNode_157": [
    {
      "isDB": true,
      "name": "vectorDB",
      "type": "select",
      "label": "Vector DB",
      "required": true,
      "isPrivate": true,
      "description": "Select the vector database where the action will be performed.",
      "defaultValue": ""
    }
  ],
  "firecrawlNode_785": [
    {
      "name": "credentials",
      "type": "select",
      "label": "Credentials",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for crawler authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ],
  "vectorizeNode_314": [
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
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "triggers": {
    "crawling_indexation_api_request": "@triggers/webhooks/crawling-indexation_api-request.ts"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "@triggers/webhooks/crawling-indexation_api-request.ts",
        "advance_schema": "@triggers/webhooks/crawling-indexation_api-request.ts"
      }
    }
  },
  {
    "id": "firecrawlNode_785",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "firecrawlNode",
      "modes": {
        "webhook": "list"
      },
      "values": {
        "nodeName": "Firecrawl",
        "url": "{{triggerNode_1.output.url}}",
        "mode": "sync",
        "urls": "{{triggerNode_1.output.urls}}",
        "delay": 0,
        "limit": 10,
        "mobile": false,
        "search": "",
        "timeout": 30000,
        "waitFor": 2000,
        "crawlDepth": "5",
        "crawlLimit": "10",
        "excludePath": [],
        "excludeTags": [],
        "includePath": [],
        "includeTags": [],
        "sitemapOnly": false,
        "crawlSubPages": false,
        "ignoreSitemap": false,
        "webhookEvents": [
          "completed",
          "failed",
          "page",
          "started"
        ],
        "changeTracking": false,
        "webhookHeaders": "",
        "onlyMainContent": true,
        "webhookMetadata": "",
        "includeSubdomains": false,
        "maxDiscoveryDepth": "10",
        "allowBackwardLinks": false,
        "allowExternalLinks": false,
        "skipTlsVerification": false,
        "ignoreQueryParameters": true
      }
    }
  },
  {
    "id": "forLoopNode_370",
    "type": "forLoopNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopNode",
      "modes": {},
      "values": {
        "nodeName": "Loop",
        "wait": 0,
        "endValue": "10",
        "increment": "1",
        "connectedTo": "forLoopEndNode_301",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{firecrawlNode_785.output.data}}"
      }
    }
  },
  {
    "id": "forLoopEndNode_301",
    "type": "forLoopEndNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "forLoopEndNode",
      "modes": {},
      "values": {
        "nodeName": "Loop End",
        "connectedTo": "forLoopNode_370"
      }
    }
  },
  {
    "id": "variablesNode_658",
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
        "mapping": "{\n  \"title\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.title}}\"\n  },\n  \"description\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.description}}\"\n  },\n  \"source\": {\n    \"type\": \"string\",\n    \"value\": \"{{forLoopNode_370.output.currentValue.metadata.url}}\"\n  }\n}"
      }
    }
  },
  {
    "id": "chunkNode_968",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "modes": {},
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{forLoopNode_370.output.currentValue.markdown}}",
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
    "id": "codeNode_794",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Extract Chunks",
        "code": "let docs = {{ chunkNode_968.output.chunks }};\n\nlet outputDocs = docs.map((doc) => doc.pageContent)\n\nreturn outputDocs"
      }
    }
  },
  {
    "id": "vectorizeNode_314",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "modes": {},
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_794.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_305",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "modes": {},
      "values": {
        "nodeName": "Transform Metadata",
        "code": "let vectors = {{ vectorizeNode_314.output.vectors }};\nlet metadataProps = [];\nlet texts = {{codeNode_794.output}};\n\nfor (const idx in vectors) {\n  let metadata = {}\n  metadata[\"content\"] = texts[idx];\n  metadata[\"title\"] = {{variablesNode_658.output.title}};\n  metadata[\"description\"] = {{variablesNode_658.output.description}};\n  metadata[\"source\"] = {{variablesNode_658.output.source}};\n  metadataProps.push(metadata)\n};\n\noutput = { \"metadata\": metadataProps, \"vectors\": vectors }"
      }
    }
  },
  {
    "id": "vectorNode_157",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "modes": {},
      "values": {
        "nodeName": "Index",
        "limit": 20,
        "action": "index",
        "filters": "",
        "primaryKeys": [
          "title"
        ],
        "vectorsField": "{{codeNode_305.output.vectors}}",
        "metadataField": "{{codeNode_305.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "graphqlResponseNode_532",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"Records indexed successfully\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-firecrawlNode_785",
    "source": "triggerNode_1",
    "target": "firecrawlNode_785",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "firecrawlNode_785-forLoopNode_370",
    "source": "firecrawlNode_785",
    "target": "forLoopNode_370",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_370-variablesNode_658",
    "source": "forLoopNode_370",
    "target": "variablesNode_658",
    "type": "conditionEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    }
  },
  {
    "id": "forLoopNode_370-forLoopEndNode_301",
    "source": "forLoopNode_370",
    "target": "forLoopEndNode_301",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": false
    }
  },
  {
    "id": "vectorNode_157-forLoopEndNode_301",
    "source": "vectorNode_157",
    "target": "forLoopEndNode_301",
    "type": "defaultEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_301-forLoopNode_370",
    "source": "forLoopEndNode_301",
    "target": "forLoopNode_370",
    "type": "loopEdge",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Loop",
      "invisible": true
    }
  },
  {
    "id": "variablesNode_658-chunkNode_968",
    "source": "variablesNode_658",
    "target": "chunkNode_968",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_968-codeNode_794",
    "source": "chunkNode_968",
    "target": "codeNode_794",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_794-vectorizeNode_314",
    "source": "codeNode_794",
    "target": "vectorizeNode_314",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_314-codeNode_305",
    "source": "vectorizeNode_314",
    "target": "codeNode_305",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_305-vectorNode_157",
    "source": "codeNode_305",
    "target": "vectorNode_157",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "forLoopEndNode_301-graphqlResponseNode_532",
    "source": "forLoopEndNode_301",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_532",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_532",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
