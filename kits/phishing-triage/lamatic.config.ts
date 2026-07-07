export default {
  name: "Phishing Email Triage",
  description: "A security kit that triages emails for phishing risk. A deterministic code node extracts indicators of compromise (URLs, domains, IP-literal links), an LLM reasons over them, and a finaliser returns a structured, explainable verdict — surfaced through a Next.js analyst console.",
  version: "1.0.0",
  type: "kit" as const,
  author: { "name": "Sharvik Sutar", "email": "sharviksutar@gmail.com" },
  tags: ["security", "support"],
  steps: [
    {
      "id": "phishing-triage",
      "type": "mandatory",
      "envKey": "PHISHING_TRIAGE"
    }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/phishing-triage",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fphishing-triage%2Fapps&env=PHISHING_TRIAGE,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20project%20credentials%20and%20the%20Phishing%20Triage%20flow%20ID%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/phishing-triage"
  },
};
