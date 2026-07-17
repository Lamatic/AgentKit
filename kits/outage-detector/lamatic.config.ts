export default {
  name: "Outage Detector",
  description: "Correlates new support tickets against ticket history to catch a shared outage before it looks like a pattern to a human — verifying genuine root-cause correlation rather than surface wording similarity.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Amandeep Singh", email: "" },
  tags: ["support", "ticket-triage", "vector-search", "rag", "outage-detection", "correlation"],
  steps: [
    { id: "outage-detector", type: "mandatory" as const, envKey: "OUTAGE_DETECTOR" }
  ],
  links: {
    demo: "",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/outage-detector",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/amanbud4530/AgentKit&root-directory=kits%2Foutage-detector%2Fapps&env=OUTAGE_DETECTOR,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20keys%20and%20deployed%20flow%20ID%20are%20required.",
    docs: ""
  }
};
