// Model config: Generate Notes (LLMNode)
// Flow: release-notes-generator
//
// The concrete provider, model, and credentials are selected in Lamatic Studio
// on the "Generate Notes" node. This file is the externalized reference that the
// flow graph points at via @model-configs/release-notes-generator_generate-notes.ts.

export default {
  "generativeModelName": "@model-configs/release-notes-generator_generate-notes.ts",
  "memories": "@model-configs/release-notes-generator_generate-notes.ts",
  "messages": "@model-configs/release-notes-generator_generate-notes.ts",
};
