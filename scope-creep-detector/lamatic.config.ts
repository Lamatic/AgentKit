export default {
  type: "template",
  name: "Scope Creep Detector",
  author: "Czarina Mari Gonzales",
  description:
    "Compares a new client message against an original project scope/SOW and flags each request as In Scope, Out of Scope, or Ambiguous — helping freelancers and consultants catch scope creep before it happens.",
  tags: [
    "productivity",
    "freelance",
    "contracts",
    "text-generation",
    "llm",
  ],
  links: {
    github: "kits/scope-creep-detector",
  },
  api: {
    endpoint: "https://prod-api.lamatic.ai/graphql",
    projectId: "dcc1be74-93df-4b09-9e9a-4e97e24c64fb",
  },
  flows: [
    {
      name: "Scope Creep Detector",
      flowId: "ee3bb1d9-2722-46da-8181-25a3c5d5aae7",
      purpose:
        "Takes an original scope/SOW and a new client message, and classifies each ask in the new message as In Scope, Out of Scope, or Ambiguous with a reason.",
      inputSchema: {
        scopeText: "string",
        newMessage: "string",
      },
      outputSchema: {
        output: "string", // JSON array: [{ ask, classification, reason }]
      },
    },
  ],
};
