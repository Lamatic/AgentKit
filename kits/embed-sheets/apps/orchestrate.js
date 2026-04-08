export const config = {
    "type": "atomic",
    "flows": {
      "analysis" : {
          "name": "AI Sheets",
          "type" : "graphQL",
          "workflowId": process.env.EMBEDDED_SHEETS,
          "description": "Generate the column data based on the row data",
          "expectedOutput": ["value", "metadata"],
          "inputSchema": {
            "sheetId": "string",
            "columnId": "string",
            "rowId": "string",
            "instruction": "string",
            "aiType": "string",
            "data": "string",
            "outputFormat": "string",
            "webhookUrl": "string"
          },
          "outputSchema": {
              "value": "string",
              "metadata": "object"
          },
          "mode": "async",
          "polling" : "false"
      }
    },
    "api": {
      "endpoint": process.env.LAMATIC_API_URL,
      "projectId": process.env.LAMATIC_PROJECT_ID,
      "apiKey" : process.env.LAMATIC_API_KEY
    }
  }
  