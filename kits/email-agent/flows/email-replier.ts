/*
 * # Email Replier
 * A single-flow, API-invoked reply generator that drafts professional,
 * context-aware email responses given a sender, subject, and body, enabling
 * teams to respond faster and more consistently.
 *
 * ## Purpose
 * This flow accepts an inbound email payload (sender, subject, body) and uses
 * an LLM to draft a suitable reply. It is called synchronously by any
 * HTTP/GraphQL-capable client — a Next.js app, n8n, or helpdesk integration —
 * immediately when a reply is needed.
 *
 * ## When To Use
 * - Use when you need a first-draft reply generated automatically for an
 *   inbound email.
 * - Use in support, sales, or partnership workflows to reduce manual writing
 *   time.
 * - Use as the reply stage in a larger email automation pipeline (after
 *   classification or verification).
 *
 * ## When Not To Use
 * - Do not use when no email body is available.
 * - Do not use for analyzing or verifying an email — use email-verifier for
 *   that.
 * - Do not use when the reply requires access to external systems (CRM, ticketing)
 *   without extending this flow.
 *
 * ## Inputs
 * | Field    | Type   | Required | Description                        |
 * |----------|--------|----------|------------------------------------|
 * | sender   | string | Yes      | The email sender address or name   |
 * | subject  | string | Yes      | The email subject line             |
 * | body     | string | Yes      | The full plain-text email body     |
 *
 * ## Outputs
 * | Field  | Type   | Description                                          |
 * |--------|--------|------------------------------------------------------|
 * | output | string | AI-generated reply draft ready to send or edit       |
 *
 * ## Dependencies
 * - Lamatic GraphQL trigger/response runtime
 * - LLM provider configured via `@model-configs/email-replier_generate-text.ts`
 * - Prompt at `@prompts/email-replier_generate-text_system.md`
 */

// Flow: email-replier

// ── Meta ──────────────────────────────────────────────
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

// ── Inputs ────────────────────────────────────────────
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
};

// ── References ────────────────────────────────────────
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

// ── Nodes & Edges ─────────────────────────────────────
export const nodes = [
  {
    id: "triggerNode_1",
    type: "triggerNode",
    position: { x: 0, y: 0 },
    data: {
      nodeId: "graphqlNode",
      trigger: true,
      values: {
        nodeName: "API Request",
        responeType: "realtime",
        advance_schema: JSON.stringify({
          type: "object",
          properties: {
            sender: { type: "string" },
            subject: { type: "string" },
            body: { type: "string" },
          },
          required: ["sender", "subject", "body"],
        }),
      },
    },
  },
  {
    id: "LLMNode_100",
    type: "dynamicNode",
    position: { x: 0, y: 200 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Draft Reply",
        tools: [],
        prompts: [
          {
            id: "email-replier-system-prompt",
            role: "system",
            content: "@prompts/email-replier_generate-text_system.md",
          },
          {
            id: "email-replier-user-prompt",
            role: "user",
            content:
              "Sender: {{triggerNode_1.output.sender}}\nSubject: {{triggerNode_1.output.subject}}\nBody:\n{{triggerNode_1.output.body}}",
          },
        ],
        memories: "@model-configs/email-replier_generate-text.ts",
        messages: "@model-configs/email-replier_generate-text.ts",
        generativeModelName: "@model-configs/email-replier_generate-text.ts",
      },
    },
  },
  {
    id: "graphqlResponseNode_200",
    type: "dynamicNode",
    position: { x: 0, y: 400 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping: JSON.stringify({
          output: "{{LLMNode_100.output.generatedResponse}}",
        }),
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-LLMNode_100",
    source: "triggerNode_1",
    target: "LLMNode_100",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_100-graphqlResponseNode_200",
    source: "LLMNode_100",
    target: "graphqlResponseNode_200",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-graphqlResponseNode_200",
    source: "triggerNode_1",
    target: "graphqlResponseNode_200",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
