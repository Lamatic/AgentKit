// Model config: Write Audit Summary (LLMNode)
// Flow: scan-document
// Model selection is left to the importing user (no model_name hardcoded).
// Any fast text-generation model works well here (e.g. gemini/gemini-2.5-flash,
// openai/gpt-4o-mini, groq/llama-3.3-70b).

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
