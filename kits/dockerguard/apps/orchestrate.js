// Central config for the DockerGuard app: API credentials and flow definitions,
// all sourced from environment variables so nothing secret is committed.

export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    audit: {
      name: "DockerGuard Audit",
      workflowId: process.env.DOCKERGUARD_AUDIT ?? "",
      inputSchema: {
        dockerfile: "string",
        file_type: "string",
        filename: "string",
      },
    },
  },
};
