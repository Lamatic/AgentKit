export const config={
    "type": "sequential",
    "flows": {
        "step1": {
        "name": "Generate Steps",
        "workflowId": process.env.AGENTIC_REASONING_GENERATE_STEPS,
        "description": "Generates high-level reasoning steps for the query",
        "mode": "sync",
        "expectedOutput": "steps",
        "inputSchema": {
            "query": "string",
            "history": "array"
        },
        "outputSchema": {
            "steps": "string"
        }
        },
        "step2A": {
        "name": "Process Steps - Live Search",
        "workflowId": process.env.AGENTIC_REASONING_SEARCH_WEB,
        "description": "Processes the generated steps into research queries + links",
        "mode": "sync",
        "dependsOn": ["step1"],
        "expectedOutput": ["research", "links"],
        "inputSchema": {
            "steps": "string"
        },
        "outputSchema": {
            "research": "array",
            "links": "array"
        }
        },
        "step2B": {
        "name": "Process Steps - Database Search",
        "workflowId": process.env.AGENTIC_REASONING_DATA_SOURCE,
        "description": "Processes the generated steps into research queries + links",
        "mode": "sync",
        "dependsOn": ["step1"],
        "expectedOutput": ["research", "links"],
        "inputSchema": {
            "steps": "string"
        },
        "outputSchema": {
            "research": "array",
            "links": "array"
        }
        },
        "step3": {
        "name": "Final Writer",
        "workflowId": process.env.AGENTIC_REASONING_FINAL,
        "description": "Takes query and research results and generates the final markdown answer",
        "mode": "sync",
        "dependsOn": ["step2A", "step2B", "step2C"],
        "expectedOutput": "answer",
        "inputSchema": {
            "query": "string",
            "research": "array"
        },
        "outputSchema": {
            "answer": "string"
        }
        }
    },
    "api": {
        "endpoint": process.env.LAMATIC_API_URL,
        "projectId": process.env.LAMATIC_PROJECT_ID,
        "apiKey": process.env.LAMATIC_API_KEY
    }
}