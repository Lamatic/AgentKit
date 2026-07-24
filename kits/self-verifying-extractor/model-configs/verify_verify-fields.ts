// Model config: Verify Fields (LLMNode)
// Flow: verify
//
// The tested build uses a separate call to Groq's Llama 3.3 70B model. Credentials
// are deliberately not exported: after recreating/importing the flow, select your
// own Groq text-generation credential in Studio. Keep temperature at the lowest
// value exposed by the UI. This must remain a separate reasoning pass even when
// it uses the same underlying model as Extract.

export default {
  "generativeModelName": [
    {
      "configName": "configA",
      "type": "generator/text",
      "provider_name": "groq",
      "model_name": "groq/llama-3.3-70b-versatile",
      "params": {},
    },
  ],
  "credentials": "",
  "memories": [],
  "messages": [],
  "attachments": "",
};
