// Flow 3: Weekly quiz
// Trigger: schedule (weekly cron). Two entry points share this flow file
// conceptually: (a) generate the quiz on schedule, (b) update retention
// once the user submits answers. In Studio these can be split into two
// flows if the schedule trigger and the answer-submission trigger need to
// be separate — shown combined here for clarity.

export default {
  meta: {
    name: "weekly-quiz",
    description:
      "Generates a weekly spaced-repetition quiz from the user's saved " +
      "words (missed/unreviewed words + random fill), then updates " +
      "retention state once answers are submitted.",
  },
  inputs: {
    user_id: { type: "string", required: true },
  },
  nodes: [
    {
      nodeId: "ScheduleTrigger",
      type: "trigger",
      values: { trigger: "schedule", cron: "0 9 * * MON" }, // every Monday 9am
    },
    {
      nodeId: "SelectWordsNode",
      type: "code",
      values: { script: "@scripts/weekly-quiz_select-words_code-node.ts" },
    },
    {
      nodeId: "LLMNode",
      type: "llm",
      values: {
        prompts: [
          { role: "system", content: "@prompts/weekly-quiz_llm-node_system.md" },
          { role: "user", content: "@prompts/weekly-quiz_llm-node_user.md" },
        ],
        generativeModelName: "@model-configs/weekly-quiz_llm-node.ts",
        responseFormat: "json",
      },
    },
    {
      nodeId: "QuizOutputNode",
      type: "output",
      values: { returns: "LLMNode.output" },
    },
    {
      nodeId: "SubmitAnswersTrigger",
      type: "trigger",
      values: { trigger: "manual" }, // called separately when user submits
    },
    {
      nodeId: "UpdateRetentionNode",
      type: "code",
      values: { script: "@scripts/weekly-quiz_update-retention_code-node.ts" },
    },
  ],
  edges: [
    { from: "ScheduleTrigger", to: "SelectWordsNode" },
    { from: "SelectWordsNode", to: "LLMNode" },
    { from: "LLMNode", to: "QuizOutputNode" },
    { from: "SubmitAnswersTrigger", to: "UpdateRetentionNode" },
  ],
};
