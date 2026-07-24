export default {
  name: "projectpilot-ai",
  description: "AI-powered final year project mentor guiding engineering students from project ideation through completion, including project recommendations, tech stack and architecture blueprints, and development roadmaps with documentation and viva/resume preparation.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Kishan C", email: "kishanc5980@gmail.com" },
  tags: ["education", "ai", "student-projects", "career-guidance", "final-year-project"],
  steps: [
    { id: "discovery-flow", type: "mandatory" as const, envKey: "DISCOVERY_FLOW_ID" },
    { id: "blueprint-flow", type: "mandatory" as const, envKey: "BLUEPRINT_FLOW_ID" },
    { id: "execution-flow", type: "mandatory" as const, envKey: "EXECUTION_FLOW_ID" }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/projectpilot-ai",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/projectpilot-ai/apps"
  }
};