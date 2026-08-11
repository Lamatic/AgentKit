export default {
  name: "DocSense",
  description:
    "An adaptive document-intake agent for accountants: it reads each client document as it arrives, infers what is still missing based on what the document reveals, and for returning clients stays quiet on routine items while flagging anything different this year.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Mehwish Afsa", email: "mehwishafsa44@gmail.com" },
  tags: ["agentic", "document-intelligence", "reasoning"],
  steps: [
    {
      id: "docsense-intake",
      type: "mandatory",
      envKey: "DOCSENSE_INTAKE",
    },
  ],
  links: {
    demo: "",
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/docsense-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdocsense-agent%2Fapps&env=DOCSENSE_INTAKE,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20DocSense%20keys%20are%20required.",
    docs: "",
  },
};
