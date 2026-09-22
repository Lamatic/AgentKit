export default {
  name: "Debrief",
  description:
    "Paste messy interview feedback across rounds and get a structured summary with strengths, gaps, and action items via a single LLM extraction flow.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Narayan Joshi", email: "narayan@example.com" },
  tags: ["interview", "feedback", "summarizer", "generative"],
  steps: [
    {
      id: "summarize-feedback",
      type: "mandatory" as const,
      envKey: "SUMMARIZE_FEEDBACK",
    },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/debrief",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdebrief%2Fapps&env=SUMMARIZE_FEEDBACK,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20credentials%20and%20flow%20ID%20for%20Debrief&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
