export const config = {
    "type": "atomic",
    "flows": {
      "grammar_check" : {
          "name": "Grammar Correction",
          "type" : "graphQL",
          "workflowId": "ASSISTANT_GRAMMAR_CORRECTION",
          "description": "Correct the grammar of the selected text and return back with corrected text and recommendations",
          "expectedOutput": ["corrected_text", "corrections"],
          "inputSchema": {
              "text": "string"
          },
          "outputSchema": {
              "corrected_text": "string",
              "corrections": "array"
          },
          "mode": "sync",
          "polling" : "false"
      }
    },
    "api": {
      "endpoint": "LAMATIC_API_URL",
      "projectId": "LAMATIC_PROJECT_ID",
      "apiKey" : "LAMATIC_API_KEY"
    }
}

//REPLACE ASSISTANT_GRAMMAR_CORRECTION, LAMATIC_API_URL, LAMATIC_PROJECT_ID, LAMATIC_API_KEY and paste the update file in lamatic-config.json