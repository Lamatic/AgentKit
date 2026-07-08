export const config = {
  "type": "atomic",
  "flows": {
    "prd-copilot": {
      "name": "PRD Copilot",
      "type": "graphQL",
      "workflowId": process.env.PRD_COPILOT_FLOW_ID,
      "description": "Draft and refine a Product Requirement Document (PRD) and generate a Mermaid flowchart",
      "expectedOutput": ["answer"],
      "inputSchema": {
        "mode": "string",
        "instructions": "string",
        "answers": "string"
      },
      "outputSchema": {
        "answer": "string"
      },
      "mode": "sync",
      "polling": "false"
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
};
