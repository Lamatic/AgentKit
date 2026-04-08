// Flow: 3a-finance-fundamentals
// When @lamatic/sdk ships: import { defineFlow } from '@lamatic/sdk'

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3A. Finance - Fundamentals",
  "description": "",
  "tags": [],
  "testInput": "",
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": ""
};

// ── Inputs ────────────────────────────────────────────
export const inputs = {};

// ── References ────────────────────────────────────────
// Resources this flow depends on — each lives in its own directory
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  }
};

// ── Nodes & Edges (exact Lamatic Studio export) ───────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"companies\": \"[string]\"\n}"
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 0
    },
    "selected": false
  },
  {
    "id": "variablesNode_683",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "variablesNode",
      "values": {
        "mapping": "{\n  \"FMP_API_KEY\": {\n    \"type\": \"string\",\n    \"value\": \"YGC31QqHgXSaUQeYlauxQUPKmrwy1qY3\"\n  }\n}",
        "nodeName": "Variables"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 150
    },
    "selected": true
  },
  {
    "id": "forLoopNode_939",
    "data": {
      "label": "forLoopNode node",
      "modes": {},
      "nodeId": "forLoopNode",
      "values": {
        "wait": 0,
        "endValue": "10",
        "nodeName": "Fetch Fundamentals",
        "increment": "1",
        "connectedTo": "forLoopEndNode_544",
        "iterateOver": "list",
        "initialValue": "0",
        "iteratorValue": "{{triggerNode_1.output.companies}}"
      }
    },
    "type": "forLoopNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 300
    },
    "selected": false
  },
  {
    "id": "branchNode_285",
    "data": {
      "label": "Branch",
      "modes": {},
      "nodeId": "branchNode",
      "values": {
        "branches": [
          {
            "label": "Branch 1",
            "value": "branchNode_285-addNode_810"
          },
          {
            "label": "Branch 2",
            "value": "branchNode_285-addNode_771"
          },
          {
            "label": "Branch 3",
            "value": "branchNode_285-plus-node-addNode_891561-421"
          },
          {
            "label": "Branch 4",
            "value": "branchNode_285-plus-node-addNode_144954-658"
          }
        ],
        "nodeName": "Branching"
      }
    },
    "type": "branchNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "apiNode_845",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/balance-sheet-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Balance Sheet",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 450,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_805",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/income-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Income Statement",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_467",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/key-metrics?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Key Metrics",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 1350,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "apiNode_349",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/cash-flow-statement?symbol={{forLoopNode_939.output.currentValue}}&apikey={{variablesNode_683.output.FMP_API_KEY}}&period=annual&limit=1",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch CashFlow Statement",
        "retry_deplay": "0"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 900,
      "y": 600
    },
    "selected": false
  },
  {
    "id": "codeNode_211",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "output = {\n  \"income_statement\" : {{apiNode_805.output}}[0],\n  \"balance_sheet\" : {{apiNode_845.output}}[0],\n  \"cash_flow_statement\" : {{apiNode_349.output}}[0],\n  \"key_metrics\" : {{apiNode_467.output}}[0]\n}",
        "nodeName": "Collate Fundamentals"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 750
    },
    "selected": false
  },
  {
    "id": "forLoopEndNode_544",
    "data": {
      "label": "forLoopEndNode node",
      "modes": {},
      "nodeId": "forLoopEndNode",
      "values": {
        "nodeName": "Fetch Fundamentals End",
        "connectedTo": "forLoopNode_939"
      }
    },
    "type": "forLoopEndNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 900
    },
    "selected": false
  },
  {
    "id": "codeNode_387",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "const loopOutput = {{forLoopEndNode_544.output.loopOutput}};\n\nlet fundamentals = [];\nloopOutput.forEach((fundamental)=>{\nconsole.log(fundamental);\n  fundamentals.push({\n    \"company\" : fundamental['codeNode_211']['output']['income_statement']['symbol'],\n    \"fundamentals\" : fundamental['codeNode_211']['output']\n  });\n})\n\noutput = fundamentals;",
        "nodeName": "Collate Results"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 1050
    },
    "selected": false
  },
  {
    "id": "responseNode_triggerNode_1",
    "data": {
      "label": "Response",
      "nodeId": "graphqlResponseNode",
      "values": {
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "API Response",
        "webhookUrl": "",
        "retry_delay": "0",
        "outputMapping": "{\n  \"fundamental_data\": \"{{codeNode_387.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 675,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "forLoopNode_939-branchNode_285-169",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_939",
    "target": "branchNode_285",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_805-563",
    "data": {
      "branchName": "Branch 1"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_805",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_845-401",
    "data": {
      "branchName": "Branch 2"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_845",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_349-414",
    "data": {
      "branchName": "Branch 3"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_349",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "branchNode_285-apiNode_467-605",
    "data": {
      "branchName": "Branch 4"
    },
    "type": "branchEdge",
    "source": "branchNode_285",
    "target": "apiNode_467",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "triggerNode_1-variablesNode_683",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_683",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "variablesNode_683-forLoopNode_939",
    "type": "defaultEdge",
    "source": "variablesNode_683",
    "target": "forLoopNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_211-forLoopEndNode_544-370",
    "data": {},
    "type": "defaultEdge",
    "source": "codeNode_211",
    "target": "forLoopEndNode_544",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_544-codeNode_387",
    "type": "defaultEdge",
    "source": "forLoopEndNode_544",
    "target": "codeNode_387",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_387-responseNode_triggerNode_1",
    "type": "defaultEdge",
    "source": "codeNode_387",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_805-codeNode_211-859",
    "type": "defaultEdge",
    "source": "apiNode_805",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_845-codeNode_211-847",
    "type": "defaultEdge",
    "source": "apiNode_845",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_349-codeNode_211-252",
    "type": "defaultEdge",
    "source": "apiNode_349",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_467-codeNode_211-740",
    "type": "defaultEdge",
    "source": "apiNode_467",
    "target": "codeNode_211",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "response-trigger_triggerNode_1",
    "type": "responseEdge",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger"
  },
  {
    "id": "forLoopNode_939-forLoopEndNode_544-306",
    "data": {
      "condition": "Loop"
    },
    "type": "loopEdge",
    "source": "forLoopNode_939",
    "target": "forLoopEndNode_544",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopEndNode_544-forLoopNode_939-229",
    "data": {
      "condition": "Loop",
      "invisible": true
    },
    "type": "loopEdge",
    "source": "forLoopEndNode_544",
    "target": "forLoopNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  }
];

export default { meta, inputs, references, nodes, edges };
