// Model config: draft-appeal_letter
// Provider, model and credential are selected in Lamatic Studio on deploy; this
// file records the recommended generation parameters. Any chat-capable model works —
// a strong reasoning model is recommended for draft-appeal_letter.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {
        "temperature": 0.3,
        "max_tokens": 6000,
        "top_p": 0.9
      },
      "configName": "configA",
      "model_name": "",
      "provider_name": "",
      "credential_name": ""
    }
  ]
};
