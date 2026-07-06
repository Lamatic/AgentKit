export default {
  name: "Offer Negotiator",
  description:
    "Turn a job offer into a negotiation plan and a ready-to-send counter-offer. Paste your offer and priorities; get an assessment, leverage points, target numbers, talking points, a counter-offer email, and a call script.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Ahmed Abdur Rahman", email: "asquarer02@yahoo.com" },
  tags: ["career", "agentic", "productivity"],
  steps: [
    {
      id: "offer-negotiator",
      type: "mandatory" as const,
      envKey: "OFFER_NEGOTIATOR",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/offer-negotiator",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Foffer-negotiator%2Fapps&env=OFFER_NEGOTIATOR,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20flow%20ID%20and%20API%20keys%20are%20required.",
    docs: "https://lamatic.ai/docs",
  },
};
