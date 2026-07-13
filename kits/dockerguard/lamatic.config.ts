export default {
  name: "DockerGuard",
  description:
    "Paste a Dockerfile or docker-compose file and get a prioritized security and best-practice audit — each finding includes severity, the offending line, why it matters, and a concrete fix, plus an overall score.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Yash Tripathi", email: "hydra191102@gmail.com" },
  tags: ["devops", "security", "generative"],
  steps: [
    { id: "dockerguard-audit", type: "mandatory" as const, envKey: "DOCKERGUARD_AUDIT" },
  ],
  links: {
    demo: "https://agent-kit-roan.vercel.app",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/dockerguard",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fdockerguard%2Fapps&env=DOCKERGUARD_AUDIT,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20flow%20ID%20and%20API%20credentials%20are%20required.&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
