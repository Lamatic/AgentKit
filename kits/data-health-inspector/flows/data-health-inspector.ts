// Flow: data-health-inspector

// -- Meta --
export const meta = {
  "name": "Data-Health-Inspector",
  "description": "An AI agent that inspects datasets for quality issues, missing values, and anomalies.",
  "tags": ["data", "quality", "inspector", "health"],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Anand Chaudhary",
    "email": "anandchaudhary3505@gmail.com"
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
    "data_health_inspector_code_node_951_code": "@scripts/data-health-inspector_code-node-951_code.ts",
    "data_health_inspector_code_node_183_code": "@scripts/data-health-inspector_code-node-183_code.ts",
    "data_health_inspector_code_node_678_code": "@scripts/data-health-inspector_code-node-678_code.ts",
    "data_health_inspector_code_node_568_code": "@scripts/data-health-inspector_code-node-568_code.ts",
    "data_health_inspector_code_node_724_code": "@scripts/data-health-inspector_code-node-724_code.ts",
    "data_health_inspector_code_node_122_code": "@scripts/data-health-inspector_code-node-122_code.ts"
  }
};

// -- Nodes & Edges --
export const nodes = [
  {
    "id": "extractFromFileNode_417",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "extractFromFileNode",
      "values": {
        "nodeName": "Extract from File",
        "fileUrl": "{{triggerNode_1.output.dataset_url}}",
        "format": "csv",
        "encodeAsBase64": false,
        "delimiter": ",",
        "headers": true,
        "quote": "\"",
        "ignoreEmpty": false,
        "comment": "null",
        "discardUnmappedColumns": false,
        "trim": false,
        "rtrim": false,
        "ltrim": false,
        "maxRows": "0",
        "skipRows": "0",
        "encoding": "utf8",
        "returnRawText": false,
        "joinPages": false,
        "password": "",
        "id": "extractFromFileNode_417"
      }
    }
  },
  {
    "id": "codeNode_951",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Validation & Schema Profiler",
        "code": "@scripts/data-health-inspector_code-node-951_code.ts"
      }
    }
  },
  {
    "id": "codeNode_183",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Type Inference & Consistency",
        "code": "@scripts/data-health-inspector_code-node-183_code.ts"
      }
    }
  },
  {
    "id": "codeNode_678",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Completeness, Uniqueness, Validity",
        "code": "@scripts/data-health-inspector_code-node-678_code.ts"
      }
    }
  },
  {
    "id": "codeNode_568",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Stats, IQR Outliers, Pearson",
        "code": "@scripts/data-health-inspector_code-node-568_code.ts"
      }
    }
  },
  {
    "id": "codeNode_724",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Engine & Scoring",
        "code": "@scripts/data-health-inspector_code-node-724_code.ts"
      }
    }
  },
  {
    "id": "codeNode_122",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Code",
        "code": "@scripts/data-health-inspector_code-node-122_code.ts"
      }
    }
  },
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
        "advance_schema": "{\n  \"dataset_url\": \"string\"\n}",
        "responeType": "async",
        "id": "triggerNode_1"
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
        "responseNode": {
          "nodeId": "responseNode_triggerNode_1",
          "nodeType": "graphqlResponseNode",
          "nodeName": "API Response",
          "values": {
            "outputMapping": "{\n  \"health_score\": \"{{codeNode_724.output.health_score}}\",\n  \"health_status\": \"{{codeNode_724.output.health_status}}\",\n  \"row_count\": \"{{codeNode_951.output.row_count}}\",\n  \"col_count\": \"{{codeNode_951.output.col_count}}\",\n  \"summary\": \"{{codeNode_790.output.ai_interpretation.summary}}\",\n  \"dataset_readiness\": \"{{codeNode_790.output.ai_interpretation.dataset_readiness}}\",\n  \"major_risks\": \"{{codeNode_790.output.ai_interpretation.major_risks}}\",\n  \"recommendations\": \"{{codeNode_790.output.ai_interpretation.recommendations}}\"\n}",
            "webhookUrl": "",
            "headers": "{\"content-type\":\"application/json\"}",
            "retries": "0",
            "retry_delay": "0"
          },
          "needs": [
            "codeNode_790"
          ],
          "modes": {},
          "schema": {}
        },
        "outputMapping": "{\n  \"health_score\": \"{{codeNode_724.output.health_score}}\",\n  \"health_status\": \"{{codeNode_724.output.health_status}}\",\n  \"row_count\": \"{{codeNode_951.output.row_count}}\",\n  \"col_count\": \"{{codeNode_951.output.col_count}}\",\n  \"summary\": \"{{codeNode_122.output.ai_interpretation.summary}}\",\n  \"dataset_readiness\": \"{{codeNode_122.output.ai_interpretation.dataset_readiness}}\",\n  \"major_risks\": \"{{codeNode_122.output.ai_interpretation.major_risks}}\",\n  \"recommendations\": \"{{codeNode_122.output.ai_interpretation.recommendations}}\"\n}",
        "nodeName": "",
        "id": "responseNode_triggerNode_1"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-extractFromFileNode_417",
    "source": "triggerNode_1",
    "target": "extractFromFileNode_417",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "extractFromFileNode_417-codeNode_951",
    "source": "extractFromFileNode_417",
    "target": "codeNode_951",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_951-codeNode_183",
    "source": "codeNode_951",
    "target": "codeNode_183",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_183-codeNode_678",
    "source": "codeNode_183",
    "target": "codeNode_678",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_678-codeNode_568",
    "source": "codeNode_678",
    "target": "codeNode_568",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_568-codeNode_724",
    "source": "codeNode_568",
    "target": "codeNode_724",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_724-codeNode_122",
    "source": "codeNode_724",
    "target": "codeNode_122",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_122-responseNode_triggerNode_1",
    "source": "codeNode_122",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-responseNode_triggerNode_1",
    "source": "triggerNode_1",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
