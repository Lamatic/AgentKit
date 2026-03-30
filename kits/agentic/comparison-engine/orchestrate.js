export const config = {
  "type": "sequential",
  "flows": {
    "research_entity_1": {
      "name": "Research Entity A",
      "workflowId": process.env.COMPARISON_RESEARCH_A,
      "description": "Performs deep research on the first entity",
      "mode": "sync",
      "expectedOutput": "research",
      "inputSchema": {
        "entity": "string",
        "criteria": "string"
      },
      "outputSchema": {
        "research": "string",
        "links": "array"
      }
    },
    "research_entity_2": {
      "name": "Research Entity B",
      "workflowId": process.env.COMPARISON_RESEARCH_B,
      "description": "Performs deep research on the second entity",
      "mode": "sync",
      "expectedOutput": "research",
      "inputSchema": {
        "entity": "string",
        "criteria": "string"
      },
      "outputSchema": {
        "research": "string",
        "links": "array"
      }
    },
    "compare_entities": {
      "name": "Analyze & Tabulate",
      "workflowId": process.env.COMPARISON_ANALYZE,
      "description": "Compares research from both entities and generates a structured table",
      "mode": "sync",
      "dependsOn": ["research_entity_1", "research_entity_2"],
      "expectedOutput": ["comparison_table", "differences"],
      "inputSchema": {
        "research_a": "string",
        "research_b": "string",
        "criteria": "string"
      },
      "outputSchema": {
        "comparison_table": "object",
        "differences": "string"
      }
    },
    "final_verdict": {
      "name": "Expert Verdict",
      "workflowId": process.env.COMPARISON_VERDICT,
      "description": "Provides a final recommendation based on the comparison",
      "mode": "sync",
      "dependsOn": ["compare_entities"],
      "expectedOutput": "verdict",
      "inputSchema": {
        "comparison_data": "object",
        "criteria": "string"
      },
      "outputSchema": {
        "verdict": "string"
      }
    }
  },
  "api": {
    "endpoint": process.env.LAMATIC_API_URL,
    "projectId": process.env.LAMATIC_PROJECT_ID,
    "apiKey": process.env.LAMATIC_API_KEY
  }
}
