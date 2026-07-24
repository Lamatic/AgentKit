// Model config: Extract Fields (LLMNode)
// Flow: extract
//
// The tested build uses Groq's Llama 3.3 70B model. Credentials are deliberately
// not exported: after recreating/importing the flow, select your own Groq text-
// generation credential in Studio. Extraction is a literal-copy task, so keep
// temperature at the lowest value exposed by the model configuration UI.

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
