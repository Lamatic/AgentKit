export const config = {
  type: "atomic",
  flows: {
    supportTriage: {
      name: "Support Triage",
      type: "graphQL",
      workflowId: process.env.FLOW_SUPPORT_TRIAGE,
      description: "Triages support tickets into a structured summary for routing and escalation.",
      expectedOutput: [
        "category",
        "severity",
        "priority_reason",
        "possible_duplicate",
        "recommended_owner",
        "sla_risk",
        "escalation_summary",
      ],
      inputSchema: {
        ticket_text: "string",
        customer_tier: "string",
        channel: "string",
        created_at: "string",
        past_ticket_context: "string",
      },
      outputSchema: {
        category: "string",
        severity: "string",
        priority_reason: "string",
        possible_duplicate: "boolean",
        recommended_owner: "string",
        sla_risk: "boolean",
        escalation_summary: "string",
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
