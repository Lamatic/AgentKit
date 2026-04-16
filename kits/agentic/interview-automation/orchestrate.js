export const config = {
  "type": "atomic",
  "flows": {
  "interviewAnalysis" : {
      "name": "Interview Transcript Analysis",
          "type" : "graphQL",
      "workflowId": process.env.AUTOMATION_INTERVIEW_AUTOMATION,
      "description": "Analyzes a live interview transcript and returns actionable interviewer insights",
      "expectedOutput": ["summary", "keySignals", "followUps", "recommendation"],
          "inputSchema": {
              "type": "string",
              "instructions": "string"
          },
          "outputSchema": {
        "summary": "string",
        "keySignals": "string",
        "followUps": "string",
              "recommendation": "string"
          },
          "mode": "sync",
          "polling" : false
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey" : process.env.LAMATIC_API_KEY
    }
}