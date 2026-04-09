// Memory config: Memory Add - Store Analysis (memoryNode)
// Flow: analyze

export default {
  "memoryCollection": "founderLensChatHistory",
  "uniqueId": "{{triggerNode_1.output.userId}}",
  "sessionId": "{{triggerNode_1.output.sessionId}}",
  "memoryValue": [
    {
      "role": "user",
      "content": "Founder Lens analysis for idea: {{triggerNode_1.output.idea}}"
    },
    {
      "role": "assistant",
      "content": "{{codeNode_briefToFacts.output.factsString}}"
    }
  ],
  "embeddingModelName": "",
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {},
      "configName": "configA",
      "model_name": "openrouter/openai/gpt-4o",
      "credentialId": "f41360bc-89df-4fe7-a349-421552b805fb",
      "provider_name": "openrouter",
      "credential_name": "chatgpt"
    }
  ]
};
