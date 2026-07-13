export default {
  name: "SubSniffer — Subscription Audit",
  description: "Paste a bank statement or list of charges and get a clear audit of recurring subscriptions, which ones you don't use, your estimated monthly savings, and one-click cancellation links.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Satyam Singh", email: "satyamsingh7734@gmail.com" },
  tags: ["finance", "subscriptions", "savings", "productivity"],
  steps: [
    {
      id: "subsniffer",
      type: "mandatory" as const,
      envKey: "SUBSNIFFER_FLOW_ID",
    },
  ],
  links: {
    demo: "https://subsniffer.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/subsniffer",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsubsniffer%2Fapps&env=SUBSNIFFER_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20are%20required.",
    docs: "https://lamatic.ai/docs",
  },
};
