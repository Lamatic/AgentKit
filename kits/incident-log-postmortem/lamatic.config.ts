export default {
  "name": "Incident Postmortem Pipeline",
  "description": "Turns raw, unstructured incident logs into a ranked root-cause analysis (tagged Evidence-based / Inferred / Unknown), an immediate mitigation checklist, a plain-English stakeholder update, and an assembled postmortem draft — no runbooks, incident ID, or repo access required, just the raw log dump.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Garvit Bajaj",
    "email": "garvitbajaj05@gmail.com"
  },
  "tags": ["incident-response", "devops", "sre", "postmortem", "log-analysis"],
  "steps": [
    {
      "id": "incident-log-postmortem",
      "type": "mandatory",
      "envKey": "LAMATIC_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/incident-log-postmortem/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/incident-log-postmortem"
  },
  "flows": {
    "incident-log-postmortem": {
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
      "polling": false
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
};