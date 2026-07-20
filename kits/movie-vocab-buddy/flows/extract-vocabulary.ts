// Flow 1: Extraction + difficulty tagging
// Trigger: manual (called from the frontend when a user uploads/pastes a transcript)

export default {
  meta: {
    name: "extract-vocabulary",
    description:
      "Extracts notable vocabulary/phrases from a movie or show transcript, " +
      "tags each with a difficulty level, and stores them.",
  },
  inputs: {
    transcript_text: { type: "string", required: true },
    source_title: { type: "string", required: true },
    user_id: { type: "string", required: true },
  },
  nodes: [
    {
      nodeId: "InputNode",
      type: "trigger",
      values: { trigger: "manual" },
    },
    {
      nodeId: "LLMNode",
      type: "llm",
      values: {
        prompts: [
          { role: "system", content: "@prompts/extract-vocabulary_llm-node_system.md" },
          { role: "user", content: "@prompts/extract-vocabulary_llm-node_user.md" },
        ],
        generativeModelName: "@model-configs/extract-vocabulary_llm-node.ts",
        responseFormat: "json",
      },
    },
    {
      nodeId: "StoreWordsNode",
      type: "code",
      values: {
        script: "@scripts/extract-vocabulary_code-node.ts",
      },
    },
    {
      nodeId: "OutputNode",
      type: "output",
      values: { returns: "StoreWordsNode.words" },
    },
  ],
  edges: [
    { from: "InputNode", to: "LLMNode" },
    { from: "LLMNode", to: "StoreWordsNode" },
    { from: "StoreWordsNode", to: "OutputNode" },
  ],
};
