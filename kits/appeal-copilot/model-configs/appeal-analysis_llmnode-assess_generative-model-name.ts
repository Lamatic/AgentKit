// Model config: Assess Appeal Strength (InstructorLLMNode)
// Flow: appeal-analysis
// Tested with gpt-4o-mini via OpenAI. Replace provider/model/credential to match
// your own Lamatic Studio project.

export default {
  generativeModelName: [
    {
      configName: "configA",
      type: "generator/text",
      provider_name: "openai",
      credential_name: "OpenAI",
      model_name: "gpt-4o-mini",
      params: {},
    },
  ],
};
