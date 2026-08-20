export default {
  name: "Atlas Agent",
  description: "Turns a project document into traceable requirements, approval-gated task proposals, explainable assignment recommendations, and focused execution context.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Pradeep Nagarajan" },
  tags: ["agentic", "project-management", "requirements", "human-in-the-loop", "developer-tools"],
  steps: [
    { id: "atlas-extract-requirements", type: "mandatory" as const, envKey: "ATLAS_EXTRACT_REQUIREMENTS_FLOW_ID" },
    { id: "atlas-generate-task-proposals", type: "mandatory" as const, envKey: "ATLAS_GENERATE_TASK_PROPOSALS_FLOW_ID", prerequisiteSteps: ["atlas-extract-requirements"] },
    { id: "atlas-recommend-assignment", type: "mandatory" as const, envKey: "ATLAS_RECOMMEND_ASSIGNMENT_FLOW_ID", prerequisiteSteps: ["atlas-generate-task-proposals"] },
    { id: "atlas-deliver-execution-context", type: "mandatory" as const, envKey: "ATLAS_DELIVER_EXECUTION_CONTEXT_FLOW_ID", prerequisiteSteps: ["atlas-recommend-assignment"] }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/atlas-agent",
    deploy: "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fatlas-agent%2Fapps&env=LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,ATLAS_EXTRACT_REQUIREMENTS_FLOW_ID,ATLAS_GENERATE_TASK_PROPOSALS_FLOW_ID,ATLAS_RECOMMEND_ASSIGNMENT_FLOW_ID,ATLAS_DELIVER_EXECUTION_CONTEXT_FLOW_ID",
    docs: "https://github.com/Pradeeprdncas/Synapse.ai"
  }
};
