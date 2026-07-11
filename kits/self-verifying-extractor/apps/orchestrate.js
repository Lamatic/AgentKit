export const config = {
  "type": "sequential",
  "flows": {
    "extract": {
      "name": "Extract",
      "workflowId": process.env.DOC_EXTRACT_FLOW,
      "description": "Pulls a fixed set of fields out of the document as structured JSON.",
      "mode": "sync",
      "expectedOutput": "extraction",
      "inputSchema": {
        "document": "string"
      },
      "outputSchema": {
        "extraction": "object"
      }
    },
    "verify": {
      "name": "Verify",
      "workflowId": process.env.DOC_VERIFY_FLOW,
      "description": "Independently grounds each extracted field to the source text and flags what it cannot prove.",
      "mode": "sync",
      "dependsOn": ["extract"],
      "expectedOutput": "verifications",
      "inputSchema": {
        "document": "string",
        "extraction": "JSON string"
      },
      "outputSchema": {
        "verifications": "array"
      }
    },
    "report": {
      "name": "Report",
      "workflowId": process.env.DOC_REPORT_FLOW,
      "description": "Routes evidence-checked fields into Verified, Needs review, and Not found buckets plus a readable report.",
      "mode": "sync",
      "dependsOn": ["verify"],
      "expectedOutput": ["verified", "needs_review", "not_found", "report", "summary"],
      "inputSchema": {
        "verifications": "JSON string"
      },
      "outputSchema": {
        "verified": "array",
        "needs_review": "array",
        "not_found": "array",
        "report": "string",
        "summary": "object with total, verified_count, needs_review_count, not_found_count"
      }
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
}
