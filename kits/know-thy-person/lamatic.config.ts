export default {
  name: "Know Thy Person",
  description:
    "Paste an email and name (optionally a LinkedIn/X/company link) and get a fully-sourced meeting-prep dossier: who they are, what they're into outside work, and warm talking points — every claim linked to a real source, with an honest 'couldn't confirm' where it can't verify.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Ayush Gupta", email: "ayushgupta0610@gmail.com" },
  tags: ["agentic", "research", "meeting-prep", "no-hallucination"],
  steps: [
    {
      id: "know-thy-person",
      type: "mandatory" as const,
      envKey: "KNOW_THY_PERSON",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/know-thy-person",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fknow-thy-person%2Fapps&env=KNOW_THY_PERSON,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Know%20Thy%20Person%20keys%20are%20required.",
  },
};
