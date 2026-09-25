export default {
  "name": "Maintenance Evidence Copilot",
  "description": "A bounded maintenance assessment kit that preserves deterministic telemetry rules and presents evidence-backed inspection guidance.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Anudeep Reddy",
    "email": "anudeepreddy332@gmail.com"
  },
  "tags": ["maintenance", "evidence", "safety"],
  "steps": [
    {
      "id": "triage-maintenance-event",
      "type": "mandatory" as const,
      "envKey": "TRIAGE_MAINTENANCE_EVENT_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fmaintenance-evidence-copilot%2Fapps&env=LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL,TRIAGE_MAINTENANCE_EVENT_FLOW_ID",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/maintenance-evidence-copilot"
  }
};
