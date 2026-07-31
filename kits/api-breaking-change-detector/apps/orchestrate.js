export const config = {
  type: "atomic",
  flows: {
    "api-breaking-change-detector": {
      name: "API Breaking Change Detector",
      type: "graphQL",
      workflowId: process.env.API_BREAKING_CHANGE_DETECTOR,
      description:
        "Compare old and new API schemas to detect breaking changes and generate migration guides",
      expectedOutput: ["answer"],
      inputSchema: {
        old_schema: "string",
        new_schema: "string",
        instructions: "string",
      },
      outputSchema: {
        answer: "string",
        severity: "string",
        breaking_changes: "array",
        migration_steps: "array",
      },
      mode: "sync",
      polling: "false",
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY,
  },
}
