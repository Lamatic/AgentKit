// Flow: execute-flow

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "Execute Flow",
  "description": "This flow introduces the execute flow function, which allows executing another flow and passing required variables.",
  "tags": [
    "🚀 Startup"
  ],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/execute-flow",
  "author": {
    "name": "Naitik Kapadia",
    "email": "naitikk@lamatic.ai"
  }
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Cross-references to extracted resources in their own directories
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "triggers": {
    "execute_flow_api_request": "@triggers/webhooks/execute-flow_api-request.ts"
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
        "responeType": "@triggers/webhooks/execute-flow_api-request.ts",
        "advance_schema": "@triggers/webhooks/execute-flow_api-request.ts"
      }
    }
  },
  {
    "id": "flowNode_390",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "flowNode",
      "values": {
        "nodeName": "Execute Flow",
        "flowId": "3f94aedc-9887-4977-a8d4-9676aaf8bbf7",
        "requestInput": "{\n  \"topic\": \"{{triggerNode_1.output.topic}}\"\n}"
      }
    }
  },
  {
    "id": "graphqlResponseNode_611",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"flowOutput\": \"{{flowNode_390.output.flowOutput}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-flowNode_390",
    "source": "triggerNode_1",
    "target": "flowNode_390",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "flowNode_390-graphqlResponseNode_611",
    "source": "flowNode_390",
    "target": "graphqlResponseNode_611",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_611",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_611",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
