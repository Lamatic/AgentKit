export default {
  "name": "peer-demo-showcase",
  "description": "AI-Powered Sponsor Track Matching & Hackathon Showcase Kit",
  "version": "1.0.0",
  "type": "kit",
  "author": {
    "name": "Avadhut",
    "email": "avadhutscasual@gmail.com"
  },
  "tags": ["ai", "showcase", "hackathon", "sponsors", "judging"],
  "steps": [
    {
      "id": "showcase-submission-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_SUBMISSION_FLOW_ID"
    },
    {
      "id": "submissions-manager-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_SUBMISSIONS_MANAGER_FLOW_ID"
    },
    {
      "id": "sponsors-manager-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_SPONSORS_MANAGER_FLOW_ID"
    },
    {
      "id": "judging-manager-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_JUDGING_MANAGER_FLOW_ID"
    },
    {
      "id": "event-config-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_EVENT_CONFIG_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Avad05/AgentKit&root-directory=kits/peer-demo-showcase/apps",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/peer-demo-showcase"
  }
};
