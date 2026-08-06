export default {
  name: "Personalized Outreach Agent",
  description: "A self-fact-checking outreach writer. It drafts a personalized job-outreach message from a company brief and the candidate's real profile, then a Verifier step audits every claim against that profile, removes anything unsupported, and returns a transparent verification report alongside the corrected message.",
  version: "1.0.0",
  type: "template" as const,
  author: { name: "Ganesh Kumar T", email: "ganesh957kumar@gmail.com" },
  tags: ["outreach", "hiring", "guardrails", "anti-hallucination", "multi-agent"],
  steps: [
    { id: "personalized-outreach-agent", type: "mandatory" as const }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/personalized-outreach-agent"
  }
};
