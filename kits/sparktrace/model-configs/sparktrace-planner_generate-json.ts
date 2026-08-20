// Model config: Generate JSON (InstructorLLMNode)
// Flow: sparktrace-planner
// Tier: Opus — this is the per-turn investigation-directing brain. It sees the fullest
// context (evidence-so-far, hypotheses tried) and makes the single highest-stakes
// decision in the loop, so it gets the most capable model.
// Credentials are blanked here for sharing — set your own model credential in Lamatic Studio.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "top_p": 0.9,
        "max_tokens": 2048,
        "temperature": 0.2
      },
      "configName": "configA",
      "model_name": "claude-opus-4-8",
      "credentialId": "",
      "provider_name": "anthropic",
      "credential_name": ""
    }
  ]
};
