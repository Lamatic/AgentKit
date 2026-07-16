// Bridges environment variables to the Lamatic SDK client and flow map.
// Flow IDs and credentials come from apps/.env.local (see .env.example).
export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? "",
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    "lead-outreach-agent": {
      name: "Lead Outreach Agent",
      workflowId: process.env.LEAD_OUTREACH_AGENT ?? "",
    },
  },
} as const;
