// Flow: introduction-to-rag

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Introduction to RAG",
  "description": "This flow acts as an introduction to RAG, where you can ask a query based on a given text and get your answers from that specific knowledge base.",
  "tags": [
    "📞 Support",
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/introduction-to-rag",
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
    "introduction_to_rag_rag_system": "@prompts/introduction-to-rag_rag_system.md"
  },
  "scripts": {
    "introduction_to_rag_code": "@scripts/introduction-to-rag_code.ts"
  },
  "modelConfigs": {
    "introduction_to_rag_rag": "@model-configs/introduction-to-rag_rag.ts"
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
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "chunkNode_582",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "chunkNode",
      "values": {
        "nodeName": "Chunking",
        "chunkField": "{{triggerNode_1.output.text}}",
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
    "id": "codeNode_502",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/introduction-to-rag_code.ts"
      }
    }
  },
  {
    "id": "vectorizeNode_222",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorizeNode",
      "values": {
        "nodeName": "Vectorize",
        "inputText": "{{codeNode_502.output}}",
        "embeddingModelName": {}
      }
    }
  },
  {
    "id": "codeNode_352",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/introduction-to-rag_code.ts"
      }
    }
  },
  {
    "id": "IndexNode_810",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "IndexNode",
      "values": {
        "nodeName": "Index",
        "vectorDB": "",
        "primaryKeys": "",
        "vectorsField": "{{codeNode_352.output.vectors}}",
        "metadataField": "{{codeNode_352.output.metadata}}",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "RAGNode_149",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "RAGNode",
      "values": {
        "nodeName": "RAG",
        "limit": "@model-configs/introduction-to-rag_rag.ts",
        "filters": "",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/introduction-to-rag_rag_system.md"
          }
        ],
        "memories": "@model-configs/introduction-to-rag_rag.ts",
        "messages": "@model-configs/introduction-to-rag_rag.ts",
        "vectorDB": "",
        "certainty": "@model-configs/introduction-to-rag_rag.ts",
        "queryField": "{{triggerNode_1.output.query}}",
        "embeddingModelName": "@model-configs/introduction-to-rag_rag.ts",
        "generativeModelName": "@model-configs/introduction-to-rag_rag.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_251",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"answer\": \"{{RAGNode_149.output.modelResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-chunkNode_582",
    "source": "triggerNode_1",
    "target": "chunkNode_582",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "chunkNode_582-codeNode_502",
    "source": "chunkNode_582",
    "target": "codeNode_502",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_502-vectorizeNode_222",
    "source": "codeNode_502",
    "target": "vectorizeNode_222",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorizeNode_222-codeNode_352",
    "source": "vectorizeNode_222",
    "target": "codeNode_352",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_352-IndexNode_810",
    "source": "codeNode_352",
    "target": "IndexNode_810",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "IndexNode_810-RAGNode_149",
    "source": "IndexNode_810",
    "target": "RAGNode_149",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "RAGNode_149-graphqlResponseNode_251",
    "source": "RAGNode_149",
    "target": "graphqlResponseNode_251",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_251",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_251",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
