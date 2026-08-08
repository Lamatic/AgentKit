// Model config for the main generation node. `model` is overridden at
// runtime by the flow's `targetModel` input, so callers can route to
// whichever model their org has approved — this config just sets safe
// defaults if targetModel is left blank.
export default {
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000
};
