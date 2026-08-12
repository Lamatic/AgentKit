// Model config: instructor-llmnode-201 (InstructorLLMNode)

export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {
        temperature: 0.1,
        top_p: 1,
        max_tokens: 1600,
      },
      configName: "configA",
      model_name: "groq/llama-3.3-70b-versatile",
      credentialId: "",
      provider_name: "groq",
      credential_name: "groq",
    },
  ],
};
