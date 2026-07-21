// Model config: Detect Subscriptions (InstructorLLMNode)
// Flow: subsniffer
// Model selection is left to the importing user (no model_name hardcoded).
// Pick any text-generation model in your Lamatic project (e.g. gemini/gemini-2.5-flash,
// openai/gpt-4o-mini, groq/qwen3-32b, etc.) when deploying.

export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {},
      configName: "configA",
      model_name: "",
      credentialId: "",
      provider_name: "",
      credential_name: "",
    },
  ],
  memories: "[]",
  messages: "[]",
  attachments: "",
};
