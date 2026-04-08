// Flow: 3b-finance-historical-stock-data

// ── Meta ──────────────────────────────────────────────
export const meta = {
  "name": "3B. Finance - Historical Stock Data",
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
// Cross-references to extracted resources in their own directories
// NOTE: Trigger widget settings are saved to triggers/widgets/ but NOT cross-referenced here
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "scripts": {
    "3b_finance_historical_stock_data_one_year_ago_date": "@scripts/3b-finance-historical-stock-data_one-year-ago-date.ts",
    "3b_finance_historical_stock_data_group_data": "@scripts/3b-finance-historical-stock-data_group-data.ts",
    "3b_finance_historical_stock_data_collate_results": "@scripts/3b-finance-historical-stock-data_collate-results.ts"
  }
};

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    "id": "triggerNode_1",
    "data": {
      "modes": {},
      "nodeId": "graphqlNode",
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      },
      "trigger": true
    },
    "type": "triggerNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
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
      "x": 0,
      "y": 150
    },
    "selected": true
  },
  {
    "id": "codeNode_311",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/3b-finance-historical-stock-data_one-year-ago-date.ts",
        "nodeName": "One Year Ago Date"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 300
    },
    "selected": false
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
        "nodeName": "Fetch Stock Data",
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
      "x": 0,
      "y": 450
    },
    "selected": false
  },
  {
    "id": "apiNode_336",
    "data": {
      "label": "New",
      "modes": {},
      "nodeId": "apiNode",
      "values": {
        "url": "https://financialmodelingprep.com/stable/historical-price-eod/full?symbol={{forLoopNode_939.output.currentValue}}&from={{codeNode_311.output}}&to=2024-11-1&apikey={{variablesNode_683.output.FMP_API_KEY}}",
        "body": "",
        "method": "GET",
        "headers": "{\"content-type\":\"application/json\"}",
        "retries": "0",
        "nodeName": "Fetch Stock Price",
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
    "id": "codeNode_403",
    "data": {
      "label": "dynamicNode node",
      "modes": {},
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/3b-finance-historical-stock-data_group-data.ts",
        "nodeName": "Group Data"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
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
        "nodeName": "Fetch Stock Data End",
        "connectedTo": "forLoopNode_939"
      }
    },
    "type": "forLoopEndNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
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
        "code": "@scripts/3b-finance-historical-stock-data_collate-results.ts",
        "nodeName": "Collate Results"
      }
    },
    "type": "dynamicNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
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
        "outputMapping": "{\n  \"historic_data\": \"{{codeNode_387.output}}\"\n}"
      },
      "isResponseNode": true
    },
    "type": "responseNode",
    "measured": {
      "width": 218,
      "height": 95
    },
    "position": {
      "x": 0,
      "y": 1200
    },
    "selected": false
  }
];

export const edges = [
  {
    "id": "triggerNode_1-variablesNode_683",
    "type": "defaultEdge",
    "source": "triggerNode_1",
    "target": "variablesNode_683",
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
    "id": "variablesNode_683-codeNode_311",
    "type": "defaultEdge",
    "source": "variablesNode_683",
    "target": "codeNode_311",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_311-forLoopNode_939",
    "type": "defaultEdge",
    "source": "codeNode_311",
    "target": "forLoopNode_939",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "forLoopNode_939-apiNode_336-552",
    "data": {
      "condition": "Loop Start",
      "invisible": true
    },
    "type": "conditionEdge",
    "source": "forLoopNode_939",
    "target": "apiNode_336",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "apiNode_336-codeNode_403",
    "type": "defaultEdge",
    "source": "apiNode_336",
    "target": "codeNode_403",
    "sourceHandle": "bottom",
    "targetHandle": "top"
  },
  {
    "id": "codeNode_403-forLoopEndNode_544",
    "type": "defaultEdge",
    "source": "codeNode_403",
    "target": "forLoopEndNode_544",
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
