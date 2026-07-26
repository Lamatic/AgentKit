export default {
  "name": "support-to-engineering-bug-bridge",
  "description": "AI-powered support-to-engineering bug bridge that clusters Zendesk issues, detects duplicates, and manages GitHub engineering escalations.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Kavya Raghavendran",
    "email": "kavyaraghavendran10@gmail.com"
  },
  "tags": [
    "zendesk",
    "github",
    "bug-triage",
    "ai-agent",
    "support-engineering"
  ],
  "steps": [
    {
      "id": "bug-bridge-flow",
      "type": "mandatory",
      "envKey": "BUG_BRIDGE_FLOW_ID"
    },
    {
      "id": "bug-bridge-list-flow",
      "type": "mandatory",
      "envKey": "BUG_BRIDGE_LIST_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsupport-to-engineering-bug-bridge%2Fapps&env=BUG_BRIDGE_FLOW_ID,BUG_BRIDGE_LIST_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/support-to-engineering-bug-bridge"
  }
};
