export const config = {
  "type": "single",
  "flows": {
    "step1": {
      "name": "API Change Review",
      "workflowId": process.env.LAMATIC_API_CHANGE_REVIEW_FLOW_ID,
      "description": "Classifies OpenAPI change facts by consumer impact and drafts migration notes and a changelog entry",
      "mode": "sync",
      "expectedOutput": ["verdict", "changes", "migrationNotes", "changelog"],
      "inputSchema": {
        "changes": "array",
        "totalChanges": "number",
        "oldVersion": "string",
        "newVersion": "string",
        "endpointsTouched": "array",
        "audience": "string"
      },
      "outputSchema": {
        "verdict": "string",
        "summary": "string",
        "oldVersion": "string",
        "newVersion": "string",
        "totalChanges": "number",
        "counts": "object",
        "changes": "array",
        "migrationNotes": "string",
        "changelog": "string"
      }
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
}
