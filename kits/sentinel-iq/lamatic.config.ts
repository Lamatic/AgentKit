export default {
  name: "SentinelIQ",
  description:
    "Triages raw security alerts into severity-scored, ATT&CK-mapped incident reports",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Amaresh Hebbar",
  },
  tags: ["security", "incident-response", "triage", "soc"],
  steps: [
    {
      id: "sentinel-triage",
      type: "mandatory" as const,
      envKey: "SENTINEL_TRIAGE_FLOW_ID",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/sentinel-iq",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/sentinel-iq/apps",
    docs: "https://lamatic.ai/docs",
  },
};
