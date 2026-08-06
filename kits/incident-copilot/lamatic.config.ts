export default {
  name: "Incident Copilot",
  description:
    "An investigation agent for on-call engineers. Paste a production alert and it grounds hypotheses in your runbooks and recent GitHub activity (tool call), ranks likely root causes with supporting AND contradicting evidence, remembers the incident so new information revises the ranking instead of restarting, and drafts a Slack update plus a postmortem skeleton.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Tushar Anand", email: "tusharanand797@gmail.com" },
  tags: ["agentic", "incident-response", "devtools", "reasoning"],
  steps: [
    {
      id: "investigate",
      type: "mandatory" as const,
      envKey: "INVESTIGATE_FLOW_ID"
    },
    {
      id: "draft-comms",
      type: "mandatory" as const,
      envKey: "DRAFT_COMMS_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/incident-copilot",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fincident-copilot%2Fapps&env=INVESTIGATE_FLOW_ID,DRAFT_COMMS_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,GITHUB_TOKEN&envDescription=Lamatic%20flow%20IDs%20and%20project%20credentials.%20GITHUB_TOKEN%20is%20optional."
  }
};
