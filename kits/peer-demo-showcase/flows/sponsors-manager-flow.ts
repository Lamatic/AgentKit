// Flow: sponsors-manager-flow (Consolidated Flow 3/5)

export const meta = {
  "name": "sponsors-manager-flow",
  "description": "Consolidated flow for reading available sponsors and adding new sponsor tracks",
  "tags": ["sponsors", "management"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Avadhut",
    "email": "avadhutscasual@gmail.com"
  }
};

export const inputs = {};
export const references = {};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"action\": \"string\",\n  \"name\": \"string\",\n  \"description\": \"string\"\n}"
      }
    }
  },
  {
    "id": "tablesNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_1",
        "data": "{\n  \"name\": \"{{triggerNode_1.output.name}}\",\n  \"description\": \"{{triggerNode_1.output.description}}\"\n}",
        "limit": "50",
        "query": "",
        "where": "",
        "action": "{{(triggerNode_1.output.action == 'add_sponsor' || triggerNode_1.output.action == 'insert') ? 'insert' : ((triggerNode_1.output.action == 'update_sponsor' || triggerNode_1.output.action == 'upvote') ? 'update' : 'select')}}",
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
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "id": "responseNode_triggerNode_1",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"sponsors\": {{tablesNode_1.output}}\n}"
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
