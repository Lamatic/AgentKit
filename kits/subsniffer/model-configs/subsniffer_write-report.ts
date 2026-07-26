// Model config: Write Report (LLMNode)
// Flow: subsniffer
// Model selection is left to the importing user (no model_name hardcoded).
// Pick any text-generation model in your Lamatic project when deploying.

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
  credentials: "",
  memories: "[]",
  messages: "[]",
  attachments: "",
};
