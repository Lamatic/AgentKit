// Model config: Generate JSON (InstructorLLMNode). Structured-output reasoning
// that returns one diagnosis + one recommendation per hotspot.
//
// `credentialId` points at the Gemini credential in the author's Lamatic Studio
// project; Studio rebinds it to your own credential when you attach one to the
// node. Swap `model_name` for a stronger model once verified in your project.
export default {
  generativeModelName: [
    {
      type: "generator/text",
      params: {},
      configName: "configA",
      model_name: "gemini-3.5-flash-lite",
      credentialId: "524ebef7-5b2a-46c5-b793-ad1c0325d8c9",
      provider_name: "gemini",
      credential_name: "Gemini",
    },
  ],
};
