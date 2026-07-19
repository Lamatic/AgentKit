/**
 * Runtime glue between the app and the deployed Lamatic flows.
 * Mirrors the `apps/orchestrate.js` that Studio's Export generates: it reads the
 * flow IDs + API credentials from env and exposes them to the SDK client and the
 * server actions. The source-of-truth metadata for these steps/envKeys is
 * ../lamatic.config.ts. When Vaibhav's Studio export ships its own orchestrate
 * glue, reconcile against this shape.
 */
export const config = {
  flows: {
    "analyze-journal": {
      name: "Analyze Journal",
      envKey: "ANALYZE_JOURNAL_FLOW_ID",
      workflowId: process.env.ANALYZE_JOURNAL_FLOW_ID || "",
    },
    "chat-with-journal": {
      name: "Chat With Journal",
      envKey: "CHAT_WITH_JOURNAL_FLOW_ID",
      workflowId: process.env.CHAT_WITH_JOURNAL_FLOW_ID || "",
    },
    "weekly-discipline-report": {
      name: "Weekly Discipline Report",
      envKey: "WEEKLY_DISCIPLINE_REPORT_FLOW_ID",
      workflowId: process.env.WEEKLY_DISCIPLINE_REPORT_FLOW_ID || "",
    },
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL || "",
    projectId: process.env.LAMATIC_PROJECT_ID || "",
    apiKey: process.env.LAMATIC_API_KEY || "",
  },
} as const;

export type FlowKey = keyof typeof config.flows;

/** True only when the flow ID and all API creds are present — otherwise the app runs in local preview mode. */
export function isConfigured(flow: FlowKey): boolean {
  const { endpoint, projectId, apiKey } = config.api;
  return Boolean(config.flows[flow].workflowId && endpoint && projectId && apiKey);
}
