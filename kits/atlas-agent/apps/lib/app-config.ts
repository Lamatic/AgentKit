export const FLOW_ENV_KEYS = {
  extractRequirements: "ATLAS_EXTRACT_REQUIREMENTS_FLOW_ID",
  generateTaskProposals: "ATLAS_GENERATE_TASK_PROPOSALS_FLOW_ID",
  recommendAssignment: "ATLAS_RECOMMEND_ASSIGNMENT_FLOW_ID",
  deliverExecutionContext: "ATLAS_DELIVER_EXECUTION_CONTEXT_FLOW_ID"
} as const;

export const appConfig = {
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  },
  flows: {
    extractRequirements: process.env.ATLAS_EXTRACT_REQUIREMENTS_FLOW_ID,
    generateTaskProposals: process.env.ATLAS_GENERATE_TASK_PROPOSALS_FLOW_ID,
    recommendAssignment: process.env.ATLAS_RECOMMEND_ASSIGNMENT_FLOW_ID,
    deliverExecutionContext: process.env.ATLAS_DELIVER_EXECUTION_CONTEXT_FLOW_ID
  }
} as const;
