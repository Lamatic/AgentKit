export const config = {
  type: "sequential",
  flows: {
    verifier: {
      name: "Email Verifier",
      workflowId: process.env.EMAIL_VERIFIER_FLOW_ID,
      description: "Verifies and analyzes email sender, subject, and content.",
      mode: "sync",
      expectedOutput: "output",
      inputSchema: {
        sender: "string",
        subject: "string",
        body: "string"
      },
      outputSchema: {
        output: "string"
      }
    },
    replier: {
      name: "Email Replier",
      workflowId: process.env.EMAIL_REPLIER_FLOW_ID,
      description: "Generates context-aware reply drafts to inbound emails.",
      mode: "sync",
      expectedOutput: "output",
      inputSchema: {
        sender: "string",
        subject: "string",
        body: "string",
        verdict: "string",
        confidence: "number",
        reasons: "array"
      },
      outputSchema: {
        output: "string"
      }
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
}
