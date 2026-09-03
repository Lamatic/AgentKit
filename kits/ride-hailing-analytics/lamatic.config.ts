export default {
  "name": "ride-hailing-text-to-sql",
  "description": "A conversational analytics assistant for a ride-hailing operations dataset. Ask questions in plain English and get back a validated read-only SQL query, the results, a natural-language answer, and a suggested chart type. Follow-up questions in the same session are understood in context.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Avikal Singh",
    "email": "avikalgangwar1@gmail.com"
  },
  "tags": ["text-to-sql", "analytics", "sql", "chatbot", "data"],
  "steps": [
    {
      "id": "ride-hailing-text-to-sql",
      "type": "mandatory" as const
    }
  ],
  "links": {
    "deploy": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/ride-hailing-analytics"
  }
};