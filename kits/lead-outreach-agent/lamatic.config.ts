export default {
  name: "Lead Outreach Agent",
  description:
    "Turns a single lead (name, company, website) into a personalized cold email plus a follow-up, grounded on the company's own website content.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Rishav Jamwal", email: "rishav.rishu86@gmail.com" },
  tags: ["agentic", "outreach", "sales", "email", "rag"],
  steps: [
    {
      id: "lead-outreach-agent",
      type: "mandatory" as const,
      envKey: "LEAD_OUTREACH_AGENT",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/lead-outreach-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Flead-outreach-agent%2Fapps&env=LEAD_OUTREACH_AGENT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20credentials%20and%20the%20Lead%20Outreach%20Agent%20flow%20ID%20are%20required.",
  },
};
