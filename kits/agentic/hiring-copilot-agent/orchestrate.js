export const config = {
  type: "atomic",
  flows: {
    hiring_copilot: {
      name: "AI Hiring Copilot",
      type: "graphQL",
      workflowId: process.env.AGENTIC_GENERATE_CONTENT,
      description:
        "Helps Recruiters shortlist perfect candidate against a JD from a pool of candidates.",
      inputSchema: {
        job_description: "string",
        resume: "string"
      },
      outputSchema: {
        candidate: {
          name: "string",
          skills: {
            name: "string",
            skills_gained: "string"
          },
          experience: "number"
        },
        evaluation: {
          final_score: "number",
          verdict: "string",
          breakdown: {
            skill_match: "number",
            experience_match: "number",
            project_relevance: "number"
          }
        },
        reasoning: "string"
      },
      mode: "sync",
      polling: "false"
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
};