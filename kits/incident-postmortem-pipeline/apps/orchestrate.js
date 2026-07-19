export const config = {
    "type": "atomic",
    "flows": {
      "incident-postmortem-pipeline": {
          "name": "Incident Postmortem Pipeline",
          "type": "graphQL",
          "workflowId": process.env.LAMATIC_FLOW_ID,
          "description": "Turns raw incident logs into a ranked, evidence-graded root-cause analysis, mitigation checklist, stakeholder summary, and assembled postmortem",
          "expectedOutput": ["postmortem"],
          "inputSchema": {
              "logs": "string",
              "serviceName": "string",
              "recentDeployTime": "string"
          },
          "outputSchema": {
              "postmortem": "string"
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