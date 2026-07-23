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
      "id": "incident-postmortem-pipeline",
      "type": "mandatory",
      "envKey": "57f9edf3-1b23-44d6-af40-bd5b7e2fd610"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/incident-postmortem-pipeline/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/incident-postmortem-pipeline"
  }
};