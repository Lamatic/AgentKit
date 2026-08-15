// Flow: ride-hailing-text-to-sql

// -- Meta --
export const meta = {
  "name": "ride-hailing-text-to-sql",
  "description": "",
  "tags": [],
  "testInput": null,
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "",
  "author": {
    "name": "Avikal Singh",
    "email": "avikalgangwar1@gmail.com"
  }
};

// -- Inputs --
export const inputs = {
  "InstructorLLMNode_573": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ],
  "InstructorLLMNode_699": [
    {
      "name": "generativeModelName",
      "label": "Generative Model Name",
      "type": "model"
    }
  ]
};

// -- References --
export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "ride_hailing_text_to_sql_instructor_llmnode_573_system_0": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-573_system_0.md",
    "ride_hailing_text_to_sql_instructor_llmnode_573_user_1": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-573_user_1.md",
    "ride_hailing_text_to_sql_instructor_llmnode_699_system_0": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-699_system_0.md",
    "ride_hailing_text_to_sql_instructor_llmnode_699_user_1": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-699_user_1.md"
  },
  "modelConfigs": {
    "ride_hailing_text_to_sql_instructor_llmnode_573_generative_model_name": "@model-configs/ride-hailing-text-to-sql_instructor-llmnode-573_generative-model-name.ts",
    "ride_hailing_text_to_sql_instructor_llmnode_699_generative_model_name": "@model-configs/ride-hailing-text-to-sql_instructor-llmnode-699_generative-model-name.ts"
  },
  "scripts": {
    "ride_hailing_text_to_sql_code_node_162_code": "@scripts/ride-hailing-text-to-sql_code-node-162_code.ts",
    "ride_hailing_text_to_sql_code_node_320_code": "@scripts/ride-hailing-text-to-sql_code-node-320_code.ts"
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
        "id": "triggerNode_1",
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"question\": \"string\",\n  \"sessionId\": \"string\"\n}"
      }
    }
  },
  {
    "id": "tablesNode_976",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_976",
        "data": "{}",
        "limit": "1",
        "query": "SELECT * FROM your_table WHERE id = ?",
        "where": {
          "conditions": [
            {
              "value": "{{triggerNode_1.output.sessionId}}",
              "column": "sessionId",
              "operator": "="
            }
          ],
          "conjunction": "AND"
        },
        "action": "select",
        "offset": "0",
        "columns": [
          "question",
          "sql",
          "answer"
        ],
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "memory_table"
      }
    }
  },
  {
    "id": "codeNode_162",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ride-hailing-text-to-sql_code-node-162_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "InstructorLLMNode_573",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"sql\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"A single read-only SELECT query, or null if the question cannot be answered\"\n    },\n    \"explanation\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"One sentence explaining the query or why it could not be generated\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-573_system_0.md"
          },
          {
            "id": "9da6293c-4372-4a67-9170-b9baeee5c806",
            "role": "user",
            "content": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-573_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/ride-hailing-text-to-sql_instructor-llmnode-573_generative-model-name.ts"
      }
    }
  },
  {
    "id": "codeNode_320",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "code": "@scripts/ride-hailing-text-to-sql_code-node-320_code.ts",
        "nodeName": "Code"
      }
    }
  },
  {
    "id": "conditionNode_757",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_757-addNode_407",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{codeNode_320.output.valid}}\",\n      \"operator\": \"==\",\n      \"value\": \"true\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_757-addNode_578",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "plus-node-addNode_135886",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
    }
  },
  {
    "id": "apiNode_117",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "apiNode",
      "values": {
        "id": "apiNode_117",
        "url": "https://ride-hailing-analytics-app.vercel.app/api/execute-sql",
        "body": "{\"sql\": \"{{codeNode_320.output.sql}}\"}",
        "method": "POST",
        "headers": "{\"Content-Type\":\"application/json\",\"x-api-secret\":\"{{secrets.project.EXECUTE_SQL_SECRET}}\"}",
        "retries": "0",
        "nodeName": "API",
        "retry_deplay": "0",
        "convertXmlResponseToJson": false
      }
    }
  },
  {
    "id": "InstructorLLMNode_699",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "InstructorLLMNode",
      "values": {
        "tools": [],
        "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"A 2-3 sentence plain-English answer to the user's question\"\n    },\n    \"chartType\": {\n      \"type\": \"string\",\n      \"required\": true,\n      \"description\": \"One of: bar, line, table, none\"\n    }\n  }\n}",
        "prompts": [
          {
            "id": "187c2f4b-c23d-4545-abef-73dc897d6b7b",
            "role": "system",
            "content": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-699_system_0.md"
          },
          {
            "id": "8d6540da-072f-4114-ba27-7215c01c4135",
            "role": "user",
            "content": "@prompts/ride-hailing-text-to-sql_instructor-llmnode-699_user_1.md"
          }
        ],
        "memories": "[]",
        "messages": "[]",
        "nodeName": "Generate JSON",
        "attachments": "",
        "generativeModelName": "@model-configs/ride-hailing-text-to-sql_instructor-llmnode-699_generative-model-name.ts"
      }
    }
  },
  {
    "id": "tablesNode_770",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_770",
        "data": "{}",
        "limit": "1",
        "query": "SELECT * FROM your_table WHERE id = ?",
        "where": {
          "conditions": [
            {
              "value": "{{triggerNode_1.output.sessionId}}",
              "column": "sessionId",
              "operator": "="
            }
          ],
          "conjunction": "AND"
        },
        "action": "select",
        "offset": "0",
        "columns": [
          "sessionId"
        ],
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "memory_table"
      }
    }
  },
  {
    "id": "conditionNode_199",
    "type": "conditionNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Condition",
        "conditions": [
          {
            "label": "Condition 1",
            "value": "conditionNode_199-addNode_991",
            "condition": "{\n  \"operator\": null,\n  \"operands\": [\n    {\n      \"name\": \"{{tablesNode_770.output.results.length}}\",\n      \"operator\": \"==\",\n      \"value\": \"0\"\n    }\n  ]\n}"
          },
          {
            "label": "Else",
            "value": "conditionNode_199-addNode_103",
            "condition": {}
          }
        ],
        "allowMultipleConditionExecution": false
      }
    }
  },
  {
    "id": "tablesNode_469",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_469",
        "data": "{ \"question\": \"{{triggerNode_1.output.question}}\",  \"sql\": \"{{codeNode_320.output.sql}}\",  \"answer\": \"{{InstructorLLMNode_699.output.answer}}\"}",
        "limit": "10",
        "query": "SELECT * FROM your_table WHERE id = ?",
        "where": {
          "conditions": [
            {
              "value": "{{triggerNode_1.output.sessionId}}",
              "column": "sessionId",
              "operator": "="
            }
          ],
          "conjunction": "AND"
        },
        "action": "update",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "memory_table"
      }
    }
  },
  {
    "id": "tablesNode_405",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "tablesNode",
      "values": {
        "id": "tablesNode_405",
        "data": "{ \"sessionId\": \"{{triggerNode_1.output.sessionId}}\",  \"question\": \"{{triggerNode_1.output.question}}\",  \"sql\": \"{{codeNode_320.output.sql}}\",  \"answer\": \"{{InstructorLLMNode_699.output.answer}}\"}",
        "limit": "10",
        "query": "SELECT * FROM your_table WHERE id = ?",
        "where": "",
        "action": "insert",
        "offset": "0",
        "columns": "*",
        "orderBy": "",
        "nodeName": "Tables",
        "tableName": "memory_table"
      }
    }
  },
  {
    "id": "addNode_271",
    "type": "addNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "addNode",
      "values": {}
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
        "outputMapping": "{\n  \"answer\": \"{{InstructorLLMNode_699.output.answer}}\",\n  \"chartType\": \"{{InstructorLLMNode_699.output.chartType}}\",\n  \"sql\": \"{{codeNode_320.output.sql}}\",\n  \"results\": \"{{apiNode_117.output.rows}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "codeNode_162-InstructorLLMNode_573",
    "source": "codeNode_162",
    "target": "InstructorLLMNode_573",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_573-codeNode_320",
    "source": "InstructorLLMNode_573",
    "target": "codeNode_320",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_320-conditionNode_757",
    "source": "codeNode_320",
    "target": "conditionNode_757",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_757-apiNode_117-825",
    "source": "conditionNode_757",
    "target": "apiNode_117",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "apiNode_117-InstructorLLMNode_699",
    "source": "apiNode_117",
    "target": "InstructorLLMNode_699",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_757-plus-node-addNode_135886-145",
    "source": "conditionNode_757",
    "target": "plus-node-addNode_135886",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "plus-node-addNode_135886-responseNode_triggerNode_1-560",
    "source": "plus-node-addNode_135886",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-tablesNode_976",
    "source": "triggerNode_1",
    "target": "tablesNode_976",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_976-codeNode_162",
    "source": "tablesNode_976",
    "target": "codeNode_162",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "InstructorLLMNode_699-tablesNode_770",
    "source": "InstructorLLMNode_699",
    "target": "tablesNode_770",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "tablesNode_770-conditionNode_199",
    "source": "tablesNode_770",
    "target": "conditionNode_199",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "addNode_271-responseNode_triggerNode_1",
    "source": "addNode_271",
    "target": "responseNode_triggerNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_199-tablesNode_405-778",
    "source": "conditionNode_199",
    "target": "tablesNode_405",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "tablesNode_405-addNode_271-842",
    "source": "tablesNode_405",
    "target": "addNode_271",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_199-tablesNode_469-800",
    "source": "conditionNode_199",
    "target": "tablesNode_469",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "conditionEdge"
  },
  {
    "id": "tablesNode_469-addNode_271-625",
    "source": "tablesNode_469",
    "target": "addNode_271",
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
