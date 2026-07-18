// Model config: Detect Sensitive Data (InstructorLLMNode)
// Flow: scan-document
// Model selection is left to the importing user (no model_name hardcoded).
// Pick any structured-output-capable text model in your Lamatic project
// (e.g. openai/gpt-4o-mini, gemini/gemini-2.5-flash) when deploying.

export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {},
      configName: "detect-sensitive-data-config",
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
