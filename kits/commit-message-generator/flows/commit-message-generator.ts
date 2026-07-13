export const meta = {
  name: "commit-message-generator",
  description: "Generates a conventional commit message from a git diff",
  version: "1.0.0",
};

export const inputs = {
  git_diff: { type: "string", description: "The git diff to generate a commit message for" }
};

export const nodes = [
  {
    nodeId: "apiRequest",
    type: "interface.apiRequest",
    values: {
      schema: { git_diff: "string" },
      responseType: "realtime"
    }
  },
  {
    nodeId: "generateText",
    type: "ai.generateText",
    values: {
      prompts: [
        { role: "system", content: "@prompts/commit-message-generator_llm-node_system.md" },
        { role: "user", content: "@prompts/commit-message-generator_llm-node_user.md" }
      ],
      generativeModelName: "gpt-4o-mini"
    }
  },
  {
    nodeId: "apiResponse",
    type: "interface.apiResponse",
    values: {
      response: "{{generateText.output.response}}"
    }
  }
];

export const edges = [
  { source: "apiRequest", target: "generateText" },
  { source: "generateText", target: "apiResponse" }
];
