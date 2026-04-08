export const config = {
    "type": "atomic",
    "flows": {
      "generation" : {
          "name": "Generation",
          "type" : "graphQL",
          "workflowId": process.env.AGENTIC_GENERATE_CONTENT,
          "description": "Generate the output based on the user input type and instructions",
          "expectedOutput": ["answer"],
          "inputSchema": {
              "type": "string",
              "instructions": "string"
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