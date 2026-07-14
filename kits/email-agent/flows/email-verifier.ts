/*
 * # Email Verifier
 * A single-flow, API-invoked verification endpoint that analyzes inbound email
 * content for authenticity, intent, urgency, and sender credibility, returning
 * a structured analysis to help teams triage and act on emails with confidence.
 *
 * ## Purpose
 * This flow accepts an email payload (sender, subject, body) and uses an LLM
 * to produce a structured verification report. It is designed to be called
 * synchronously by any HTTP/GraphQL-capable client — n8n, a custom UI, or a
 * helpdesk integration — immediately after an email is received.
 *
 * The output helps operators answer: Is this email legitimate? What does the
 * sender want? How urgent is it? Should it be escalated?
 *
 * ## When To Use
 * - Use when you need a fast AI-driven analysis of an inbound email before
 *   routing or acting on it.
 * - Use in triage pipelines where humans need a quick confidence signal on
 *   email authenticity or intent.
 * - Use as a pre-filter before an email reply or escalation flow.
 *
 * ## When Not To Use
 * - Do not use when no email body is available.
 * - Do not use for generating a reply — use the email-replier flow for that.
 * - Do not use as a definitive spam/phishing detector without additional
 *   signals; this is an LLM-based analysis, not a cryptographic verification.
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
 * | output | string | AI-generated verification and analysis report        |
 *
 * ## Dependencies
 * - Lamatic GraphQL trigger/response runtime
 * - LLM provider configured via `@model-configs/email-verifier_generate-text.ts`
 * - Prompt at `@prompts/email-verifier_generate-text_system.md`
 */

// Flow: email-verifier

// ── Meta ──────────────────────────────────────────────
export const meta = {
  name: "Email Verifier",
  description:
    "An AI-powered email verification and analysis tool that inspects incoming emails for authenticity, intent, and key details, helping teams triage and trust their inbox with confidence.",
  tags: ["📧 Email", "🔍 Verification", "🛡️ Security", "🚀 Support"],
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
    description: "The full plain-text body of the email to verify",
  },
};

// ── References ────────────────────────────────────────
export const references = {
  constitutions: {
    default: "@constitutions/default.md",
  },
  prompts: {
    email_verifier_generate_text_system:
      "@prompts/email-verifier_generate-text_system.md",
  },
  modelConfigs: {
    email_verifier_generate_text:
      "@model-configs/email-verifier_generate-text.ts",
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
        nodeName: "Verify Email",
        tools: [],
        prompts: [
          {
            id: "email-verifier-system-prompt",
            role: "system",
            content: "@prompts/email-verifier_generate-text_system.md",
          },
          {
            id: "email-verifier-user-prompt",
            role: "user",
            content:
              "Sender: {{triggerNode_1.output.sender}}\nSubject: {{triggerNode_1.output.subject}}\nBody:\n{{triggerNode_1.output.body}}",
          },
        ],
        memories: "@model-configs/email-verifier_generate-text.ts",
        messages: "@model-configs/email-verifier_generate-text.ts",
        generativeModelName: "@model-configs/email-verifier_generate-text.ts",
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
