// Flow 2: Post-movie quiz
// Trigger: manual — called right after extract-vocabulary completes, reusing
// the same batch of words. Results are NOT written back to the DB; this quiz
// is just-for-fun reinforcement and does not affect spaced-repetition state.

export default {
  meta: {
    name: "post-movie-quiz",
    description:
      "Generates a light multiple-choice + fill-in-the-blank quiz from the " +
      "words just extracted from a movie/show.",
  },
  inputs: {
    extracted_words_json: { type: "string", required: true },
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
          { role: "system", content: "@prompts/post-movie-quiz_llm-node_system.md" },
          { role: "user", content: "@prompts/post-movie-quiz_llm-node_user.md" },
        ],
        generativeModelName: "@model-configs/post-movie-quiz_llm-node.ts",
        responseFormat: "json",
      },
    },
    {
      nodeId: "OutputNode",
      type: "output",
      values: { returns: "LLMNode.output" },
    },
  ],
  edges: [
    { from: "InputNode", to: "LLMNode" },
    { from: "LLMNode", to: "OutputNode" },
  ],
};
