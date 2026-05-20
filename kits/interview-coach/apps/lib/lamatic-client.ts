export const lamaticClient = {
  executeFlow: async (workflowId: string, payload: Record<string, string>) => {
    const endpoint = process.env.LAMATIC_PROJECT_ENDPOINT
    const apiKey = process.env.LAMATIC_PROJECT_API_KEY
    const projectId = process.env.LAMATIC_PROJECT_ID

    const res = await fetch(endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-project-id': projectId!,
      },
      body: JSON.stringify({
        query: `query ExecuteWorkflow($workflowId: String!, $jobRole: String, $company: String, $experienceLevel: String, $background: String) {
          executeWorkflow(workflowId: $workflowId, payload: { jobRole: $jobRole, company: $company, experienceLevel: $experienceLevel, background: $background }) {
            status
            result
          }
        }`,
        variables: {
          workflowId,
          jobRole: payload.jobRole,
          company: payload.company,
          experienceLevel: payload.experienceLevel,
          background: payload.background,
        },
      }),
    })

    const json = await res.json()
    return json?.data?.executeWorkflow ?? json
  }
}