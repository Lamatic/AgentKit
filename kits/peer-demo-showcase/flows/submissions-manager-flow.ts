// Flow: submissions-manager-flow (Consolidated Flow 2/5)

export const meta = {
  "name": "submissions-manager-flow",
  "description": "Consolidated manager flow for reading, upvoting, updating status, updating details, and deleting project submissions",
  "tags": ["submissions", "management"],
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
        "advance_schema": "{\n  \"action\": \"string\",\n  \"id\": \"string\",\n  \"status\": \"string\",\n  \"github_url\": \"string\",\n  \"project_title\": \"string\",\n  \"category\": \"string\",\n  \"matched_sponsor\": \"string\",\n  \"tech_stack\": \"string\",\n  \"description\": \"string\",\n  \"breakout_table\": \"string\"\n}"
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
        "data": "{}",
        "limit": "100",
        "query": "",
        "where": "",
        "action": "select",
        "offset": "0",
        "columns": "*",
        "orderBy": "created_at DESC",
        "nodeName": "Tables",
        "tableName": "showcase_submissions"
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
        "outputMapping": "{\n  \"submissions\": {{tablesNode_1.output}}\n}"
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
