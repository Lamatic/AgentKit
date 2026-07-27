export default {
  "name": "Agent Reliability Lab",
  "description": "Audits an AI agent's system prompt for production readiness with static prompt-quality analysis, live adversarial red-teaming (injection, jailbreak, tool misuse, over-refusal), reliability scoring, and an automatically rewritten production-ready prompt.",
  "version": "1.0.0",
  "type": "kit" as const,
  "author": {
    "name": "Lakshya Kumar",
    "email": "lakshyakumar987@gmail.com"
  },
  "tags": ["security", "reliability", "audit", "agentic", "testing"],
  "steps": [
    {
      "id": "agent-reliability-audit",
      "type": "mandatory" as const,
      "envKey": "AGENT_RELIABILITY_AUDIT_FLOW_ID"
    }
  ],
  "links": {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-reliability-lab",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fagent-reliability-lab%2Fapps&env=AGENT_RELIABILITY_AUDIT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20keys%20and%20deployed%20flow%20ID%20are%20required."
  }
};
