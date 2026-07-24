// Central runtime configuration for the Phishing Triage kit.
// Reads credentials and the deployed flow ID from environment variables and
// exposes them to the Lamatic SDK client and the server action.
//
// NOTE: files import this as `../orchestrate.js` — the `.js` specifier resolves
// to this `.ts` file under Next.js / bundler module resolution.

export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? null,
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    phishingTriage: {
      name: "Phishing Email Triage",
      workflowId: process.env.PHISHING_TRIAGE ?? "",
      inputSchema: {
        subject: "string",
        from: "string",
        reply_to: "string",
        body: "string",
      },
    },
  },
} as const;

export type AppConfig = typeof config;
