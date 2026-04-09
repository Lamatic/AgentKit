// Memory config: Memory Retrieve - Conversation History (memoryRetrieveNode)
// Flow: chat

export default {
  "memoryCollection": "founderLensChatHistory",
  "searchQuery": "{{codeNode_safeMessage.output.safeMessage}}",
  "limit": "10",
  "filters": "{\n  \"operator\": \"And\",\n  \"operands\": [\n    {\n      \"path\": [\"uniqueId\"],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.userId}}\"\n    },\n    {\n      \"path\": [\"sessionId\"],\n      \"operator\": \"Equal\",\n      \"valueText\": \"{{triggerNode_1.output.sessionId}}\"\n    }\n  ]\n}",
  "embeddingModelName": "",
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {},
      "configName": "configA",
      "model_name": "openrouter/anthropic/claude-3.5-sonnet:beta",
      "credentialId": "9f493577-98a1-4e64-b831-2fa783db97b8",
      "provider_name": "openrouter",
      "credential_name": "OpenRouter Frees"
    }
  ]
};
