export const config = {
    "type": "method-group",
    "flows": {
      "indexation": {
        "method1": {
          "name": "PDF Indexation",
          "type": "graphQL",
          "workflowId": process.env.EMBEDDED_CHATBOT_PDF_INDEXATION,
          "description": "This indexes any mannual PDF upload via URL",
          "mode": "sync",
          "expectedOutput": "status",
          "inputSchema": {
            "title": "string",
            "url": "string"
          },
          "outputSchema": {
            "status": "object"
          },
          "mode": "sync"
        },
        "method2": {
          "name": "Websites Indexation",
          "type": "graphQL",
          "workflowId": process.env.EMBEDDED_CHATBOT_WEBSITES_INDEXATION,
          "description": "This indexes the given links to the database",
          "expectedOutput": "output",
          "inputSchema": {
            "urls": "array"
          },
          "outputSchema": {
            "output": "string"
          },
          "mode": "async",
          "polling": "true",
          "pollInterval": "30",
          "pollTimeout": "300"
        },
        "rollback": {
            "name": "Resource Deletion",
            "workflowId": process.env.EMBEDDED_CHATBOT_RESOURCE_DELETION,
            "description": "This deletes the given resource uploaded above",
            "mode": "sync",
            "expectedOutput": "status",
            "inputSchema": {
              "title": "string",
              "urls": "array",
              "type": "string"
            },
            "outputSchema": {
              "status": "object"
            }
          }
      },
      "chatbot": {
        "name": "Chatbot",
        "workflowId": process.env.EMBEDDED_CHATBOT_CHATBOT,
        "description": "Takes query and research results and generates the final markdown answer",
        "type": "widget"
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey" : process.env.LAMATIC_API_KEY
    }
}