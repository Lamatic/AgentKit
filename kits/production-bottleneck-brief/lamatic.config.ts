export default {
  "name": "Production Bottleneck Brief",
  "description": "Given a list of orders with stage, timeline, and quantity data, this project computes risk stats deterministically and uses an LLM to synthesize them into a prioritized, natural-language brief — overdue orders surfaced first. A companion flow lets users ask targeted questions about any single order and get a direct, jargon-free answer grounded in that order's actual numbers.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Ibrahim Khan",
    "email": "gr25816@gmail.com"
  },
  "tags": ["manufacturing", "operations", "agentic"],
  "steps": [
    {
      "id": "production-bottleneck-brief",
      "type": "mandatory",
      "envKey": "BRIEF_FLOW_ID"
    },
    {
      "id": "follow-up-qa",
      "type": "mandatory",
      "envKey": "QA_FLOW_ID"
    }
  ],
  "links": {
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/production-bottleneck-brief/apps",
    "demo": "https://agent-kit-sigma.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/production-bottleneck-brief"
  }
};
