export default {
  name: "CI/CD Diagnosis Agent",
  description:
    "An AI-powered multi-agent workflow that analyses GitHub Actions and GitLab CI logs, identifies root causes, and generates actionable, verified fixes using RAG-backed knowledge retrieval.",
  version: "1.0.0",
  type: "kit" as const,
  author: {
    name: "Pawan Chhimwal",
    email: "",
  },
  tags: [
    "ci-cd",
    "devops",
    "rag",
    "multi-agent",
    "github-actions",
    "gitlab-ci",
    "diagnosis",
    "developer-tools",
    "gemini",
  ],
  steps: [
    {
      id: "cicd-diagnosis",
      type: "mandatory" as const,
      envKey: "CICD_DIAGNOSIS_FLOW_ID",
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/ci-cd-diagnosis-agent",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fci-cd-diagnosis-agent%2Fapps&env=LAMATIC_API_KEY,LAMATIC_PROJECT_ID,LAMATIC_API_URL,CICD_DIAGNOSIS_FLOW_ID",
    docs: "https://github.com/Lamatic/AgentKit/tree/main/kits/ci-cd-diagnosis-agent/docs",
  },
};
