// Model config: Generate JSON (InstructorLLMNode)
// Flow: sparktrace-reporter
// Tier: Sonnet — synthesizes the full investigation (all steps, evidence, repo insights)
// into the final caller-facing root-cause report. Runs once per investigation, so the
// Sonnet tier buys better synthesis quality at low total cost.
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
      "model_name": "claude-sonnet-5",
      "credentialId": "",
      "provider_name": "anthropic",
      "credential_name": ""
    }
  ]
};
