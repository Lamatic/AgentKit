/*
 * # Queryline
 * Converts natural language questions into safe, read-only SQL queries with explanations.
 *
 * ## Pipeline
 * 1. Generate Text (LLM) - Convert NL question to SQL
 * 2. Code Node - Validate SQL safety (SELECT-only, no writes, enforce TOP)
 * 3. Condition Node - Check if SQL is safe
 * 4a. If safe: Execute SQL via Microsoft SQL Server node
 * 4b. If unsafe: Skip execution
 * 5. Generate Text (LLM) - Explain what the SQL does
 * 6. Code Node - Aggregate final response
 * 7. API Response - Return results
 */

export const meta = {
  "name": "Queryline",
  "description": "Natural language to safe read-only Microsoft SQL Server SQL generator and explainer.",
  "tags": ["nl-to-sql", "mssql", "sql-generation"],
  "testInput": { "question": "Show me all users" },
  "author": {
    "name": "Suraj Sonawane",
    "email": "sonawanesuraj7@gmail.com"
  }
};

export const inputs = {
  "triggerNode_1": [
    { "name": "question", "label": "Question", "type": "string", "required": true }
  ],
  "mssqlNode_execute": [
    {
      "name": "credentials",
      "label": "Credentials",
      "type": "select",
      "required": true,
      "isPrivate": true,
      "description": "Select the credentials for Microsoft SQL Server authentication.",
      "defaultValue": "",
      "isCredential": true
    }
  ]
};

export const references = {
  "constitutions": {
    "default": "@constitutions/default.md"
  },
  "prompts": {
    "sql_generation_system": "@prompts/nl-to-sql-agent_intent-node_system.md",
    "sql_generation_user": "@prompts/nl-to-sql-agent_intent-node_user.md",
    "explanation_system": "@prompts/nl-to-sql-agent_explanation-node_system.md",
    "explanation_user": "@prompts/nl-to-sql-agent_explanation-node_user.md"
  },
  "modelConfigs": {
    "sql_generation": "@model-configs/nl-to-sql-agent_intent-node.ts",
    "explanation": "@model-configs/nl-to-sql-agent_explanation-node.ts"
  },
  "scripts": {
    "validation": "@scripts/nl-to-sql-agent_validation-node.ts",
    "aggregation": "@scripts/nl-to-sql-agent_aggregation-node.ts"
  }
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": { "x": 0, "y": 0 },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": ""
      }
    }
  },
  {
    "id": "LLMNode_sql_gen",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 100 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Generate SQL",
        "tools": [],
        "prompts": [
          {
            "id": "sql-system",
            "role": "system",
            "content": "@prompts/nl-to-sql-agent_intent-node_system.md"
          },
          {
            "id": "sql-user",
            "role": "user",
            "content": "@prompts/nl-to-sql-agent_intent-node_user.md"
          }
        ],
        "memories": "@model-configs/nl-to-sql-agent_intent-node.ts",
        "messages": "@model-configs/nl-to-sql-agent_intent-node.ts",
        "generativeModelName": "@model-configs/nl-to-sql-agent_intent-node.ts"
      }
    }
  },
  {
    "id": "codeNode_validate",
    "type": "codeNode",
    "position": { "x": 0, "y": 200 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Validate SQL",
        "code": "@scripts/nl-to-sql-agent_validation-node.ts"
      }
    }
  },
  {
    "id": "conditionNode_safe",
    "type": "conditionNode",
    "position": { "x": 0, "y": 300 },
    "data": {
      "nodeId": "conditionNode",
      "values": {
        "nodeName": "Is SQL Safe?",
        "conditions": [
          {
            "label": "Safe",
            "value": "conditionNode_safe-addNode_safe",
            "condition": {
              "operator": null,
              "operands": [
                {
                  "name": "codeNode_validate.output.isSafe",
                  "operator": "==",
                  "value": "true"
                }
              ]
            }
          },
          {
            "label": "Unsafe",
            "value": "conditionNode_safe-addNode_unsafe",
            "condition": {}
          }
        ]
      }
    }
  },
  {
    "id": "mssqlNode_execute",
    "type": "mssqlNode",
    "position": { "x": -100, "y": 400 },
    "data": {
      "nodeId": "mssqlNode",
      "values": {
        "nodeName": "Execute SQL",
        "action": "run query",
        "query": "{{codeNode_validate.output.safeSql}}",
        "credentials": ""
      }
    }
  },
  {
    "id": "LLMNode_explain",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 500 },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Explain SQL",
        "tools": [],
        "prompts": [
          {
            "id": "explain-system",
            "role": "system",
            "content": "@prompts/nl-to-sql-agent_explanation-node_system.md"
          },
          {
            "id": "explain-user",
            "role": "user",
            "content": "@prompts/nl-to-sql-agent_explanation-node_user.md"
          }
        ],
        "memories": "@model-configs/nl-to-sql-agent_explanation-node.ts",
        "messages": "@model-configs/nl-to-sql-agent_explanation-node.ts",
        "generativeModelName": "@model-configs/nl-to-sql-agent_explanation-node.ts"
      }
    }
  },
  {
    "id": "codeNode_aggregate",
    "type": "codeNode",
    "position": { "x": 0, "y": 600 },
    "data": {
      "nodeId": "codeNode",
      "values": {
        "nodeName": "Aggregate Response",
        "code": "@scripts/nl-to-sql-agent_aggregation-node.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_1",
    "type": "dynamicNode",
    "position": { "x": 0, "y": 700 },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{{codeNode_aggregate.output}}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_sql_gen",
    "source": "triggerNode_1",
    "target": "LLMNode_sql_gen",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_sql_gen-codeNode_validate",
    "source": "LLMNode_sql_gen",
    "target": "codeNode_validate",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_validate-conditionNode_safe",
    "source": "codeNode_validate",
    "target": "conditionNode_safe",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "conditionNode_safe-addNode_safe",
    "source": "conditionNode_safe",
    "target": "mssqlNode_execute",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Safe"
    },
    "type": "conditionEdge"
  },
  {
    "id": "conditionNode_safe-addNode_unsafe",
    "source": "conditionNode_safe",
    "target": "codeNode_aggregate",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "data": {
      "condition": "Unsafe"
    },
    "type": "conditionEdge"
  },
  {
    "id": "mssqlNode_execute-LLMNode_explain",
    "source": "mssqlNode_execute",
    "target": "LLMNode_explain",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_explain-codeNode_aggregate",
    "source": "LLMNode_explain",
    "target": "codeNode_aggregate",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "codeNode_aggregate-graphqlResponseNode_1",
    "source": "codeNode_aggregate",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "triggerNode_1-graphqlResponseNode_1",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_1",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
