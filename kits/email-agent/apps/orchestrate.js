export const config = {
  type: "sequential",
  flows: {
    verifier: {
      name: "Email Verifier",
      workflowId: process.env.EMAIL_VERIFIER_FLOW_ID,
      description: "Verifies and analyzes email sender, subject, and content.",
      mode: "sync",
      expectedOutput: "response",
      inputSchema: {
        sender: "string",
        subject: "string",
        body: "string"
      },
      outputSchema: {
        response: "string"
      }
    },
    replier: {
      name: "Email Replier",
      workflowId: process.env.EMAIL_REPLIER_FLOW_ID,
      description: "Generates context-aware reply drafts to inbound emails.",
      mode: "sync",
      expectedOutput: "response",
      inputSchema: {
        sender: "string",
        subject: "string",
        body: "string",
        summary: "string",
        email: "string"   // combined string: {{email}} in prompt
      },
      outputSchema: {
        response: "string"
      }
    }
  },
  api: {
    endpoint: process.env.LAMATIC_API_URL,
    projectId: process.env.LAMATIC_PROJECT_ID,
    apiKey: process.env.LAMATIC_API_KEY
  }
}
