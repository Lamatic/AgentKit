export const config = {
    "type": "atomic",
    "flows": {
      "analysis" : {
          "name": "Hiring Analysis",
          "type" : "graphQL",
          "workflowId": process.env.AUTOMATION_HIRING,
          "description": "Analyses the current candidate's suitability for the job selected",
          "expectedOutput": ["score", "strength", "weakness", "recommendation"],
          "inputSchema": {
              "name": "string",
              "email": "string",
              "job_description": "string",
              "resume_url": "string"
          },
          "outputSchema": {
              "score": "number",
              "strength": "string",
              "weakness": "string",
              "recommendation": "string"
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