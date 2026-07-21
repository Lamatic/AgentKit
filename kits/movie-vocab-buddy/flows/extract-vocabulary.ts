export default {
  meta: {
    name: "extract-vocabulary",
    description:
      "Extracts notable vocabulary/phrases from a movie or show transcript and " +
      "tags each with a difficulty level.",
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
      nodeId: "OutputNode",
      type: "output",
      values: { returns: "LLMNode.words_json" },
    },
  ],
  edges: [
    { from: "InputNode", to: "LLMNode" },
    { from: "LLMNode", to: "OutputNode" },
  ],
};