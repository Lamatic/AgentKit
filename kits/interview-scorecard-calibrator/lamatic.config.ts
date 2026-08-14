export default {
  name: "Interview Scorecard Calibrator",
  description:
    "Synthesizes multi-interviewer feedback into a calibrated hiring scorecard with disagreement mapping, recommendation, and decision-summary email draft.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Swaraj Mali",
    email: "115332135+Swaraj07082@users.noreply.github.com",
  },
  tags: ["hiring", "interview", "scorecard", "agentic"],
  steps: [
    {
      id: "calibrate-scorecard",
      type: "mandatory" as const,
      envKey: "CALIBRATE_SCORECARD_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/interview-scorecard-calibrator",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Finterview-scorecard-calibrator%2Fapps&env=CALIBRATE_SCORECARD_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Interview%20Scorecard%20Calibrator%20keys%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
