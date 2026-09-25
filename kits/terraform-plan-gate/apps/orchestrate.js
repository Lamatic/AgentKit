export const config = {
  "type": "single",
  "flows": {
    "step1": {
      "name": "Terraform Plan Review",
      "workflowId": process.env.LAMATIC_TERRAFORM_PLAN_REVIEW_FLOW_ID,
      "description": "Assesses the risk of each Terraform resource change against organisation policy and drafts the review comment",
      "mode": "sync",
      "expectedOutput": ["verdict", "counts", "changes", "reviewComment"],
      "inputSchema": {
        "changes": "array",
        "totalChanges": "number",
        "summary": "string"
      },
      "outputSchema": {
        "verdict": "string",
        "summary": "string",
        "totalChanges": "number",
        "counts": "object",
        "changes": "array",
        "reviewComment": "string",
        "policiesConsulted": "array"
      }
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
}
