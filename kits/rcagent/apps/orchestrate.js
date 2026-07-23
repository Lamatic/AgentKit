export const config = {
  "type": "sequential",
  "flows": {
    "step1": {
      "name": "Planner Agent",
      "workflowId": process.env.RC_PLANNER_FLOW_ID,
      "description": "Triages alerts and logs to produce a diagnostic plan",
      "mode": "sync",
      "expectedOutput": "steps",
      "inputSchema": {
        "incidentTitle": "string",
        "alertDetails": "string",
        "logsOrSymptoms": "string"
      },
      "outputSchema": {
        "steps": "string"
      }
    },
    "step2": {
      "name": "Analyzer Agent",
      "workflowId": process.env.RC_ANALYZER_FLOW_ID,
      "description": "Performs deep code/log/config/git analysis based on plan",
      "mode": "sync",
      "dependsOn": ["step1"],
      "expectedOutput": "research",
      "inputSchema": {
        "steps": "string",
        "gitDiff": "string",
        "configSettings": "string"
      },
      "outputSchema": {
        "research": "string"
      }
    },
    "step3": {
      "name": "Synthesizer Agent",
      "workflowId": process.env.RC_SYNTHESIZER_FLOW_ID,
      "description": "Generates the final structured Root Cause Analysis report",
      "mode": "sync",
      "dependsOn": ["step2"],
      "expectedOutput": "postmortem",
      "inputSchema": {
        "incidentTitle": "string",
        "research": "string"
      },
      "outputSchema": {
        "postmortem": "string"
      }
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
}
