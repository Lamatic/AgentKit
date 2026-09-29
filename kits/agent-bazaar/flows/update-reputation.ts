// Flow: update-reputation

// -- Meta --
export const meta = {
  "name": "update-reputation",
  "description": "Calculates reputation delta after outcome. Pass = +0.05, Fail = -0.1.",
  "tags": ["marketplace", "reputation", "slashing", "reward"],
  "testInput": {
    "agentId": "agent-worker-1",
    "outcome": "pass",
    "currentReputation": 0.5
  },
  "githubUrl": "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-bazaar",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Aalok Singh",
    "email": "aalok101singh@gmail.com"
  }
};

// -- Inputs --
export const inputs = {};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "update_reputation_code_node_541_code": "@scripts/update-reputation_calc.ts"
  }
};

// -- Nodes & Edges --
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
        "advance_schema": "{\n  \"agentId\": \"string\",\n  \"outcome\": {\"type\": \"string\", \"enum\": [\"pass\", \"fail\"]},\n  \"currentReputation\": \"number\"\n}"
      }
    }
  },
  {
    "id": "codeNode_541",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/update-reputation_calc.ts",
        "nodeName": "Reputation Calculator"
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
        "outputMapping": "{\n  \"agentId\": \"{{codeNode_541.output.agentId}}\",\n  \"delta\": \"{{codeNode_541.output.delta}}\",\n  \"newScore\": \"{{codeNode_541.output.newScore}}\",\n  \"outcome\": \"{{codeNode_541.output.outcome}}\"\n}"
      }
    }
  }
];

export const edges = [
  { "id": "triggerNode_1-codeNode_541", "source": "triggerNode_1", "target": "codeNode_541", "sourceHandle": "bottom", "targetHandle": "top", "type": "defaultEdge" },
  { "id": "codeNode_541-responseNode_triggerNode_1", "source": "codeNode_541", "target": "responseNode_triggerNode_1", "sourceHandle": "bottom", "targetHandle": "top", "type": "defaultEdge" },
  { "id": "response-trigger_triggerNode_1", "source": "triggerNode_1", "target": "responseNode_triggerNode_1", "sourceHandle": "to-response", "targetHandle": "from-trigger", "type": "responseEdge" }
];

export default { meta, inputs, references, nodes, edges };
