export default {
  "name": "flow-launch-auditor",
  "description": "Evidence-backed go-live readiness review for one Lamatic Flow.",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Lucero del Alba",
    "email": "luzdealba@gmail.com"
  },
  "tags": ["launch-readiness", "evals", "observability"],
  "steps": [
    {
      "id": "flow-launch-auditor",
      "type": "mandatory",
      "envKey": "LAMATIC_FLOW_ID"
    }
  ],
  "links": {
    "demo": "https://flow-launch-auditor.vercel.app",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fflow-launch-auditor%2Fapps&env=LAMATIC_API_URL,LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_FLOW_ID&envDescription=Lamatic%20runtime%20values%20are%20required.%20See%20the%20kit%20README%20for%20setup.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/flow-launch-auditor%23run-the-app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/flow-launch-auditor"
  }
};
