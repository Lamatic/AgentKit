// Flow: get-sponsors-flow

// -- Meta --
export const meta = {
  "name": "get-sponsors-flow",
  "description": "Fetch all sponsors from the sponsors table",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Avadhut",
    "email": "avadhutscasual@gmail.com"
  }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {};

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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{}"
      }
    }
  },
  {
    "id": "tablesNode_1",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_1",
        "data": "{}",
        "limit": "100",
        "query": "SELECT * FROM sponsors",
        "where": "",
        "action": "query",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "sponsors"
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
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"sponsors\": \"{{tablesNode_1.output}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-tablesNode_1",
    "source": "triggerNode_1",
    "target": "tablesNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_1-responseNode_triggerNode_1",
    "source": "tablesNode_1",
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
