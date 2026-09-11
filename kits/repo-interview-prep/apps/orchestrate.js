export const config = {
  type: "single",
  flows: {
    step1: {
      name: "Repo Interview Prep",
      workflowId: process.env.LAMATIC_FLOW_ID,
      description:
        "Analyzes a GitHub repository and generates a complete, code-specific interview prep brief",
      mode: "sync",
      expectedOutput: ["prep_brief"],
      inputSchema: {
        github_repo_url: "string",
        target_role: "string",
        jd_text: "string",
        github_token: "string",
      },
      outputSchema: {
        prep_brief: "string",
      },
    },
  },
  api: {
    endpoint: process.env.LAMATIC_PROJECT_ENDPOINT,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_PROJECT_API_KEY,
  },
};
