export default {
  "name": "Ride-Hailing Text-to-SQL Analytics Assistant",
  "description": "A conversational analytics assistant for a ride-hailing operations dataset. Ask questions in plain English, get back a validated read-only SQL query, the query results, and a natural-language answer with a suggested chart type. Supports multi-turn follow-ups (e.g. \"now break that down by pickup city\") using a session-scoped memory pattern.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Avikal Singh",
    "email": "avikalgangwar1@gmail.com"
  },
  "tags": ["analytics", "text-to-sql", "sql", "data-analysis", "chat", "memory"],
  "steps": [
    {
      "id": "ride-hailing-text-to-sql",
      "type": "mandatory",
      "envKey": "LAMATIC_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/ride-hailing-analytics/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/ride-hailing-analytics"
  },
  "flows": {
    "ride-hailing-text-to-sql": {
      "name": "Ride-Hailing Text-to-SQL Analytics Assistant",
      "type": "graphQL",
      "workflowId": process.env.LAMATIC_FLOW_ID,
      "description": "Generates a validated read-only SQL query from a natural-language question, executes it, and returns a summarized answer with chart-ready results. Uses session-scoped memory to support conversational follow-ups.",
      "expectedOutput": ["answer", "chartType", "sql", "results"],
      "question": "string",
      "inputSchema": {
        "sessionId": "string"
      },
      "outputSchema": {
        "answer": "string",
        "chartType": "string",
        "sql": "string",
        "results": "array"
      },
      "mode": "sync",
      "polling": false
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
};
