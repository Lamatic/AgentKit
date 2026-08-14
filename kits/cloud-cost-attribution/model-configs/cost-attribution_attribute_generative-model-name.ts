// Model config: attribute (InstructorLLMNode). Reasoning-critical step — a
// higher-capability model is preferable here, but this uses the same
// gemini-3.5-flash-lite as remediate.
// Swap to a stronger model once one is verified working in your Studio project.
export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: { temperature: 0.1 },
      configName: "configA",
      model_name: "gemini-3.5-flash-lite",
      credentialId: "8ad5eee6-043a-4115-8317-f5ae22f05b8a",
      provider_name: "gemini",
      credential_name: "Gemini Keys",
    },
  ],
};
