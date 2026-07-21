export const config = {
    "type": "atomic",
    "flows": {
      "github-commit-agent" : {
          "name": "GitHub Commit Agent",
          "type": "graphQL",
          "workflowId": process.env.GITHUB_COMMIT_AGENT_FLOW_ID,
          "description": "Fetch and summarize git commits from a GitHub repository using natural language",
          "expectedOutput": ["summary", "compared"],
          "inputSchema": {
              "message": "string"
          },
          "outputSchema": {
              "summary": "string",
              "compared": "string"
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
}
