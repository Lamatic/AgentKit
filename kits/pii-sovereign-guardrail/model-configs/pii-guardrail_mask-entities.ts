// Model config for the Layer 2 NER node.
// Low temperature: this is a structured-extraction task, not a creative one —
// we want consistent, repeatable entity detection, not varied phrasing.
export default {
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0,
  maxTokens: 500,
  responseFormat: "json"
};
