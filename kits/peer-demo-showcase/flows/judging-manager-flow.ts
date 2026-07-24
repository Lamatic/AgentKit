// Flow: judging-manager-flow (Consolidated Flow 4/5)

export const meta = {
  "name": "judging-manager-flow",
  "description": "Consolidated flow for submitting judge evaluations, retrieving evaluation scores, and managing judge credentials",
  "tags": ["judges", "scoring"],
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
        "advance_schema": "{\n  \"action\": \"string\",\n  \"project_id\": \"string\",\n  \"judge_name\": \"string\",\n  \"innovation\": \"number\",\n  \"execution\": \"number\",\n  \"impact\": \"number\",\n  \"presentation\": \"number\",\n  \"notes\": \"string\"\n}"
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
        "data": "{\n  \"project_id\": \"{{triggerNode_1.output.project_id}}\",\n  \"judge_name\": \"{{triggerNode_1.output.judge_name}}\",\n  \"innovation\": \"{{triggerNode_1.output.innovation}}\",\n  \"execution\": \"{{triggerNode_1.output.execution}}\",\n  \"impact\": \"{{triggerNode_1.output.impact}}\",\n  \"presentation\": \"{{triggerNode_1.output.presentation}}\",\n  \"notes\": \"{{triggerNode_1.output.notes}}\"\n}",
        "limit": "100",
        "query": "",
        "where": "",
        "action": "{{(triggerNode_1.output.action == 'submit_score' || triggerNode_1.output.action == 'add_judge') ? 'insert' : 'select'}}",
        "offset": "0",
        "columns": "*",
        "orderBy": "created_at DESC",
        "nodeName": "Tables",
        "tableName": "judge_scores"
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
        "outputMapping": "{\n  \"scores\": {{tablesNode_1.output}}\n}"
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
