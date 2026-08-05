// Model config: Synthesize Digest (LLMNode)
// Flow: synthesize-digest

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "temperature": 0.3
      },
      "configName": "configA",
      "model_name": "gemini/gemini-2.5-flash-lite-preview-06-17",
      "provider_name": "gemini"
    }
  ],
  "memories": [],
  "messages": [
    {
      "role": "system",
      "content": "@prompts/synthesize-digest_llm-node_system.md"
    },
    {
      "role": "user",
      "content": "@prompts/synthesize-digest_llm-node_user.md"
    }
  ]
};
