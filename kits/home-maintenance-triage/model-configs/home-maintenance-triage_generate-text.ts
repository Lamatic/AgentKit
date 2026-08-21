// Model config: Generate Text (LLMNode)
// Flow: home-maintenance-triage
//
// IMPORTANT: When setting this up in Lamatic Studio, select a vision-capable
// generative model (able to accept an image input alongside text), since this
// flow's core task is analyzing a photo of a home issue.

export default {
  "generativeModelName": "@model-configs/home-maintenance-triage_generate-text.ts",
  "memories": "@model-configs/home-maintenance-triage_generate-text.ts",
  "messages": "@model-configs/home-maintenance-triage_generate-text.ts"
};
