// apps/orchestrate.js — reads deployed flow config from env at runtime.
export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
  flows: {
    "know-thy-person": {
      name: "know-thy-person",
      workflowId: process.env.KNOW_THY_PERSON,
      inputSchema: { email: "string", name: "string", person_context: "string" },
    },
  },
};
