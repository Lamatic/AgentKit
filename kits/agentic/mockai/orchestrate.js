export const config = {
    "type": "atomic",
    "flows": {
      "question" : {
          "name": "Question Generation",
          "type" : "graphQL",
          "workflowId": process.env.AGENTIC_QUESTION_FLOW_ID,
          "description": "Generates 10 interview questions based on job description",
          "expectedOutput": ["data"],
          "inputSchema": {
              "jobTitle": "string",
              "yearsOfExp": "number",
              "jobDesc": "string"
          },
          "outputSchema": {
              "data": "array"
          },
          "mode": "sync",
          "polling" : "false"
      },
      "feedback" : {
          "name": "Feedback Generation",
          "type" : "graphQL",
          "workflowId": process.env.AGENTIC_FEEDBACK_FLOW_ID,
          "description": "Provides feedback on interview answers",
          "expectedOutput": ["positives", "negatives", "rating"],
          "inputSchema": {
              "candidateResponses": "array"
          },
          "outputSchema": {
              "positives": "array",
              "negatives": "array",
              "rating": "number"
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