// Model config: Classify & Summarise Commits (LLMNode)
// Flow: github-commit-agent

export default {
  generativeModelName: [
    {
      configName: "configA",
      type: "generator/text",
      model_name: "gpt-4o-mini"
    }
  ]
};
