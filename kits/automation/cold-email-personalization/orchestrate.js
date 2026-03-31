export const config = {
  type: "atomic",
  flows: {
    coldEmail: {
      name: "Cold Email Personalisation",
      type: "graphQL",
      workflowId: process.env.AUTOMATION_COLD_EMAIL,
      description:
        "Generates personalized outreach for engineering internships from profile + student context.",
      expectedOutput: ["subject_line", "email_body", "personalized_hook"],
      inputSchema: {
        profile_data: "string",
        prospect_name: "string",
        prospect_role: "string",
        company_name: "string",
        product_description: "string",
        value_proposition: "string",
        call_to_action: "string",
      },
      outputSchema: {
        subject_line: "string",
        email_body: "string",
        personalized_hook: "string",
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
