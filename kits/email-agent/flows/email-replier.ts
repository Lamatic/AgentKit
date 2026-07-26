export const meta = {
  name: "Email Replier",
  description:
    "An AI-powered email reply generator that drafts professional, context-aware responses to incoming emails, saving teams time and ensuring consistent communication quality.",
  tags: ["📧 Email", "✍️ Reply", "🤖 Automation", "🚀 Support"],
  testInput: null,
  githubUrl:
    "https://github.com/Lamatic/AgentKit/tree/main/kits/email-agent",
  documentationUrl: "",
  deployUrl:
    "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Femail-agent%2Fapps",
  author: {
    name: "Krishna Khurana",
    email: "krishna@lamatic.ai",
  },
};

export const inputs = {
  sender: {
    type: "string",
    description: "The email sender address or display name",
  },
  subject: {
    type: "string",
    description: "The email subject line",
  },
  body: {
    type: "string",
    description: "The full plain-text body of the email to reply to",
  },
  verdict: {
    type: "string",
    description: "The legitimacy verdict from the email verifier flow",
  },
  confidence: {
    type: "number",
    description: "The confidence percentage of the legitimacy verdict",
  },
  reasons: {
    type: "array",
    description: "The list of reasons justifying the legitimacy verdict",
  },
};

export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    email_replier_generate_text_system:
      "@prompts/email-replier_generate-text_system.md",
  },
  modelConfigs: {
    email_replier_generate_text:
      "@model-configs/email-replier_generate-text.ts",
  },
};

export const nodes = [
  {
    "id": "triggerNode_1",
    "type": "triggerNode",
    "position": {
      "x": 0,
      "y": 0
    },
    "data": {
      "nodeId": "graphqlNode",
      "trigger": true,
      "values": {
        "nodeName": "API Request",
        "responeType": "realtime",
        "advance_schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"sender\": {\n      \"type\": \"string\"\n    },\n    \"subject\": {\n      \"type\": \"string\"\n    },\n    \"body\": {\n      \"type\": \"string\"\n    },\n    \"verdict\": {\n      \"type\": \"string\"\n    },\n    \"confidence\": {\n      \"type\": \"number\"\n    },\n    \"reasons\": {\n      \"type\": \"array\",\n      \"items\": {\n        \"type\": \"string\"\n      }\n    }\n  },\n  \"required\": [\n    \"sender\",\n    \"subject\",\n    \"body\"\n  ]\n}"
      }
    }
  },
  {
    "id": "LLMNode_100",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 200
    },
    "data": {
      "nodeId": "LLMNode",
      "values": {
        "nodeName": "Draft Reply",
        "tools": [],
        "prompts": [
          {
            "id": "email-replier-system-prompt",
            "role": "system",
            "content": "@prompts/email-replier_generate-text_system.md"
          },
          {
            "id": "email-replier-user-prompt",
            "role": "user",
            "content": "Sender: {{triggerNode_1.output.sender}}\nSubject: {{triggerNode_1.output.subject}}\nBody:\n{{triggerNode_1.output.body}}\n\nVerification Audit:\nVerdict: {{triggerNode_1.output.verdict}}\nConfidence: {{triggerNode_1.output.confidence}}%\nReasons: {{triggerNode_1.output.reasons}}"
          }
        ],
        "memories": "@model-configs/email-replier_generate-text.ts",
        "messages": "@model-configs/email-replier_generate-text.ts",
        "generativeModelName": "@model-configs/email-replier_generate-text.ts"
      }
    }
  },
  {
    "id": "graphqlResponseNode_200",
    "type": "dynamicNode",
    "position": {
      "x": 0,
      "y": 400
    },
    "data": {
      "nodeId": "graphqlResponseNode",
      "values": {
        "nodeName": "API Response",
        "outputMapping": "{\n  \"output\": \"{{LLMNode_100.output.generatedResponse}}\"\n}"
      }
    }
  }
];

export const edges = [
  {
    "id": "triggerNode_1-LLMNode_100",
    "source": "triggerNode_1",
    "target": "LLMNode_100",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "LLMNode_100-graphqlResponseNode_200",
    "source": "LLMNode_100",
    "target": "graphqlResponseNode_200",
    "sourceHandle": "bottom",
    "targetHandle": "top",
    "type": "defaultEdge"
  },
  {
    "id": "response-graphqlResponseNode_200",
    "source": "triggerNode_1",
    "target": "graphqlResponseNode_200",
    "sourceHandle": "to-response",
    "targetHandle": "from-trigger",
    "type": "responseEdge"
  }
];

export default { meta, inputs, references, nodes, edges };
