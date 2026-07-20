// Flow: bug-bridge-list-flow

// -- Meta --
export const meta = {
  "name": "bug-bridge-list-flow",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Kavya Raghavendran",
    "email": "kavyaraghavendran10@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "vectorNode_889": [
    {
      "name": "vectorDB",
      "label": "Vector DB",
      "type": "select"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "bug_bridge_list_flow_code_node_708_code": "@scripts/bug-bridge-list-flow_code-node-708_code.ts"
  }
};

// -- Nodes & Edges --
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
        "advance_schema": "{\"sampleInput\":\"string\"}"
      }
    }
  },
  {
    "id": "vectorNode_889",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "vectorNode",
      "values": {
        "id": "vectorNode_889",
        "limit": 1000,
        "action": "filter",
        "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\n        \"cluster_id\"\n      ],\n      \"operator\": \"NotEqual\",\n      \"valueText\": \"__never_match__\"\n    }\n  ]\n}",
        "nodeName": "VectorDB",
        "vectorDB": "bugbridgeclustersv2",
        "primaryKeys": "",
        "vectorsField": "",
        "metadataField": "",
        "duplicateOperation": "overwrite"
      }
    }
  },
  {
    "id": "codeNode_708",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/bug-bridge-list-flow_code-node-708_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "responseNode_triggerNode_1",
    "type": "responseNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"clusters\": \"{{codeNode_708.output.clustersStr}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-vectorNode_889",
    "source": "triggerNode_1",
    "target": "vectorNode_889",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "vectorNode_889-codeNode_708",
    "source": "vectorNode_889",
    "target": "codeNode_708",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_708-responseNode_triggerNode_1",
    "source": "codeNode_708",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
