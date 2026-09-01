// Model config: instructor-llmnode-481 (InstructorLLMNode)
// Flow: runbook-generator
// Configure your own Groq (or other) credential in Lamatic Studio before deploying.

export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {},
      configName: "configA",
      model_name: "groq/openai/gpt-oss-120b",
      connectionId: "",
      credentialId: "",
      provider_name: "groq",
      credential_name: "",
    },
  ],
};
