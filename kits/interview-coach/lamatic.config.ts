export default {
  name: "Interview Prep Kit",
  description: "A tailored technical and behavioral preparation coach. Takes target role, company, background, and experience level, and returns structured questions, answer tips, company insights, and a 30-60-90 day plan.",
  version: "1.0.0",
  type: "kit" as const,
  author: { "name": "Piyush Kumar Singh" },
  tags: ["assistant", "interview", "prep"],
  steps: [
    {
      "id": "interview-coach-flow",
      "type": "mandatory",
      "envKey": "LAMATIC_FLOW_ID"
    }
  ],
  links: {
    "demo": "",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-coach",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Finterview-coach%2Fapps&env=LAMATIC_FLOW_ID,LAMATIC_PROJECT_ENDPOINT,LAMATIC_PROJECT_ID,LAMATIC_PROJECT_API_KEY&envDescription=Your%20Lamatic%20Interview%20Prep%20keys%20are%20required.",
    "docs": "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-coach"
  },
};
