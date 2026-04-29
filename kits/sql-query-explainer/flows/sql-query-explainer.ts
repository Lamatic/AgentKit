// Flow: sql-query-explainer
// Accepts a raw SQL query and returns a structured JSON explanation.

export const meta = {
  "name": "SQL Query Explainer",
  "description": "Accepts any SQL query and returns a structured JSON explanation: plain-English summary, clause breakdown, performance concerns, and optimisation suggestions.",
  "tags": ["Developer Tools", "Generative", "Analytics"],
  "testInput": {
    "query": "SELECT u.id, u.name, COUNT(o.id) AS order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE u.created_at >= '2024-01-01' GROUP BY u.id, u.name HAVING COUNT(o.id) > 5 ORDER BY order_count DESC LIMIT 20;"
  },
  "githubUrl": "",
  "documentationUrl": "",
  "deployUrl": "https://studio.lamatic.ai/template/sql-query-explainer",
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "graphqlNode",
    "label": "API Request",
    "data": {
      "description": "Accepts the incoming API request. Expects a query string field containing the SQL to explain.",
      "inputs": {
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "The raw SQL query string to explain." }
          },
          "required": ["query"]
        }
      }
    }
  },
  {
    "id": "LLMNode_1",
    "type": "LLMNode",
    "label": "Explain Query",
    "data": {
      "description": "Sends the SQL query to the LLM with a structured system prompt. Returns JSON with summary, clauses, performance concerns, and optimisation suggestions.",
      "inputs": {
        "systemPrompt": "@prompts/sql-query-explainer_explain-query_system.md",
        "userPrompt": "@prompts/sql-query-explainer_explain-query_user.md",
        "modelConfig": "@model-configs/sql-query-explainer_explain-query.ts"
      },
      "outputs": { "generatedResponse": "string" }
    }
  },
  {
    "id": "responseNode_1",
    "type": "graphqlResponseNode",
    "label": "API Response",
    "data": {
      "description": "Returns the structured JSON explanation to the API caller.",
      "inputs": {
        "response": { "explanation": "{{LLMNode_1.output.generatedResponse}}" }
      },
      "responseMode": "realtime"
    }
  }
];

export const edges = [
  { "id": "edge_trigger_to_llm", "source": "triggerNode_1", "target": "LLMNode_1" },
  { "id": "edge_llm_to_response", "source": "LLMNode_1", "target": "responseNode_1" }
];
