// Model config: Explain Verdict (LLMNode)
//
// credentialId and credential_name are intentionally blank — this kit's flows have not
// been built in Lamatic Studio yet (see docs/STUDIO-BUILD.md). When you build the
// Explain Verdict node, pick an OpenAI (or equivalent chat-completion) credential from
// Studio's node picker; Studio will fill these in on export. Any small, inexpensive
// chat model is sufficient — this node only explains numbers it is given, it never
// reasons about retrieval quality itself.

export default {
  "generativeModelName": [
    {
      "type": "generator/text",
      "params": {},
      "configName": "configA",
      "model_name": "gpt-4o-mini",
      "credentialId": "",
      "provider_name": "openai",
      "credential_name": ""
    }
  ]
};
