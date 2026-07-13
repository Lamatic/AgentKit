export default {
  name: "Debate Arena",
  description: "Pose any tradeoff or decision and watch two AI agents argue opposing sides across multiple rounds, then get an impartial judge's synthesis with a pros/cons matrix and a final recommendation.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "HEMANTH AMARTHI", email: "hemanthkumar.amarthi7@gmail.com" },
  tags: ["generative", "multi-agent", "decision-making", "productivity"],
  steps: [
    { id: "debate-setup", type: "mandatory" as const, envKey: "DEBATE_SETUP_FLOW_ID" },
    { id: "debate-round", type: "mandatory" as const, prerequisiteSteps: ["debate-setup"], envKey: "DEBATE_ROUND_FLOW_ID" },
    { id: "debate-judge", type: "mandatory" as const, prerequisiteSteps: ["debate-round"], envKey: "DEBATE_JUDGE_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/debate-arena",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdebate-arena%2Fapps&env=DEBATE_SETUP_FLOW_ID,DEBATE_ROUND_FLOW_ID,DEBATE_JUDGE_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20API%20credentials%20and%20deployed%20flow%20IDs%20are%20required.&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/debate-arena%23readme"
  }
};
