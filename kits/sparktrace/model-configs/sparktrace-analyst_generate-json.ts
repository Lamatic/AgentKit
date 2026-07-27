// Model config: Generate JSON (InstructorLLMNode)
// Flow: sparktrace-analyst
// Tier: Haiku — this node reasons only over a small, pre-compacted digest (<=10 sample
// rows + deterministic stats), never raw rows. That bounded input makes it the cheapest,
// highest-frequency call in the loop (once per query), so it runs on the fastest/cheapest
// tier by design.
// Credentials are blanked here for sharing — set your own model credential in Lamatic Studio.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "top_p": 0.9,
        "max_tokens": 768,
        "temperature": 0.1
      },
      "configName": "configA",
      "model_name": "claude-haiku-4-5",
      "credentialId": "",
      "provider_name": "anthropic",
      "credential_name": ""
    }
  ]
};
