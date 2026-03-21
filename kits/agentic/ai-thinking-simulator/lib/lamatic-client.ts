const LAMATIC_API_URL = process.env.LAMATIC_API_URL
const LAMATIC_API_KEY = process.env.LAMATIC_API_KEY
const LAMATIC_PROJECT_ID = process.env.LAMATIC_PROJECT_ID

function validateEnvVars() {
  if (!LAMATIC_API_URL || !LAMATIC_API_KEY || !LAMATIC_PROJECT_ID) {
    throw new Error(
      "Missing required environment variables: LAMATIC_API_URL, LAMATIC_API_KEY, LAMATIC_PROJECT_ID"
    )
  }
}

export const lamaticClient = {
  async executeFlow(workflowId: string, inputs: Record<string, unknown>) {
    validateEnvVars()
    
    const response = await fetch(LAMATIC_API_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LAMATIC_API_KEY}`,
        "x-project-id": LAMATIC_PROJECT_ID,
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
      body: JSON.stringify({
        query: `
          query ExecuteWorkflow($workflowId: String!, $payload: JSON!) {
            executeWorkflow(workflowId: $workflowId, payload: $payload) {
              status
              result
            }
          }
        `,
        variables: { workflowId, payload: inputs },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Lamatic API error ${response.status}`)
    }

    const json = await response.json()
    
    // Handle GraphQL-level errors
    if (json.errors && json.errors.length > 0) {
      throw new Error(`Lamatic error: ${json.errors[0].message}`)
    }

    return json?.data?.executeWorkflow ?? json
  },
}
