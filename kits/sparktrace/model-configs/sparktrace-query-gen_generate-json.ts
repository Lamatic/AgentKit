// Model config: Generate JSON (InstructorLLMNode)
// Flow: sparktrace-query-gen
// Tier: Sonnet by default. For simple, well-understood hypothesis categories (e.g. a
// straightforward NULL count or row-count comparison against a fully-specified schema),
// the cheaper Haiku 4.5 (`claude-haiku-4-5`) is an acceptable fallback — see
// flows/sparktrace-query-gen.ts's top-of-file notes for when the orchestrator may swap
// this reference to a Haiku-configured variant. Default here stays Sonnet because SQL
// correctness (join direction, aggregation grain, LIMIT placement) is worth the upgrade
// for most hypotheses.
// Credentials are blanked here for sharing — set your own model credential in Lamatic Studio.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "top_p": 0.9,
        "max_tokens": 1024,
        "temperature": 0.1
      },
      "configName": "configA",
      "model_name": "claude-sonnet-5",
      "credentialId": "",
      "provider_name": "anthropic",
      "credential_name": ""
    }
  ]
};
