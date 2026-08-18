// Model config: Generate JSON (InstructorLLMNode)
// Flow: sparktrace-repo-reader
// Tier: Sonnet — reads pipeline source/DAG and returns one concise finding. Needs solid
// code comprehension but not Opus-level judgment, and runs less often than the planner.
// Credentials are blanked here for sharing — set your own model credential in Lamatic Studio.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "top_p": 0.9,
        "max_tokens": 1536,
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
