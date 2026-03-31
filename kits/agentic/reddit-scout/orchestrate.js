export const config = {
    "type": "atomic",
    "flows": {
      "reddit-scout" : {
          "name": "Reddit Scout",
          "type" : "graphQL",
          "workflowId": process.env.REDDIT_SCOUT_FLOW_ID,
          "description": "Search Reddit for product reviews and get a structured summary",
          "expectedOutput": ["answer"],
          "inputSchema": {
              "query": "string"
          },
          "outputSchema": {
              "answer": "string"
          },
          "mode": "sync",
          "polling" : "false"
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey" : process.env.LAMATIC_API_KEY
    }
}
