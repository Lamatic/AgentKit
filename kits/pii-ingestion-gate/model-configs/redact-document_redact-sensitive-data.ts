// Model config: Redact Sensitive Data (InstructorLLMNode)
// Flow: redact-document
// Model selection is left to the importing user (no model_name hardcoded).
// Use a strong structured-output model — redaction must preserve the
// document verbatim outside sensitive spans (e.g. openai/gpt-4o-mini,
// gemini/gemini-2.5-flash).

export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {},
      configName: "redact-sensitive-data-config",
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
