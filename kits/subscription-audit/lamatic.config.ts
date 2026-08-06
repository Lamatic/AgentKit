export default {
  name: "Subscription Audit",
  description: "Paste bank statement or transaction export text and get back a structured list of likely recurring subscriptions, each with a plain-language keep-or-cancel verdict.",
  version: "1.0.0",
  type: "kit" as const,
  author: {"name":"Pradhumay Gaur","email":""},
  tags: ["finance","personal productivity"],
  steps: [
    {
        "id": "subscription-audit",
        "type": "mandatory",
        "envKey": "SUBSCRIPTION_AUDIT"
    }
],
  links: {
    "demo": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/subscription-audit",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsubscription-audit%2Fapps&env=SUBSCRIPTION_AUDIT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Subscription%20Audit%20keys%20are%20required.",
    "docs": ""
},
};