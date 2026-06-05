export const config = {
  "type": "atomic",
  "flows": {
    "review-analyzer": {
      "name": "Review Analyzer",
      "type": "graphQL",
      "workflowId": process.env.REVIEW_ANALYZER_FLOW_ID,
      "description": "Analyze product reviews to yield consensus, pros/cons, and trust scores",
      "expectedOutput": ["result"],
      "inputSchema": {
        "reviews": "[string]"
      },
      "outputSchema": {
        "result": "string"
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
