// Model config: llmnode-540 (LLMNode)
// Flow: dockerguard-audit

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "top_p": 1,
        "temperature": 0.1
      },
      "configName": "configA",
      "model_name": "groq/llama-3.3-70b-versatile",
      "credentialId": "acea7289-bb2f-412e-98bf-f8c72ecc2a3f",
      "provider_name": "groq",
      "credential_name": "DockerGuard"
    }
  ]
};
