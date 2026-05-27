/**
 * Flow: research-paper-analyzer
 *
 * Build this flow in Lamatic Studio (studio.lamatic.ai):
 *
 * Node 1 — API Trigger
 *   inputSchema: { pdf_url: { type: "string" } }
 *
 * Node 2 — Extract From File
 *   fileUrl: {{apiTriggerNode_1.pdf_url}}
 *   outputKey: paper_text
 *
 * Node 3 — LLM Node
 *   model: gpt-4o (or gemini-1.5-pro)
 *   systemPrompt: @constitutions/default.md
 *   userPrompt: @prompts/analyze-paper.md  (paper_text injected)
 *   outputSchema: see below
 *
 * Node 4 — API Response
 *   output: {{LLMNode_1.output}}
 */

export const meta = {
  name: "Research Paper Analyzer",
  description:
    "Accepts a PDF URL, extracts its text, and returns a structured academic analysis as JSON.",
  tags: ["research", "pdf", "education", "summarization"],
  author: { name: "Suhas Chowdary", email: "suhaschowdary25@gmail.com" },
};

export const inputs = {};

export const references = {
  prompts: {
    analyzePaper: "@prompts/analyze-paper.md",
  },
  constitutions: {
    default: "@constitutions/default.md",
  },
};

export const nodes = [
  {
    id: "apiTriggerNode_1",
    type: "apiTriggerNode",
    data: {
      inputSchema: {
        type: "object",
        properties: {
          pdf_url: {
            type: "string",
            description: "Publicly accessible URL of the academic PDF to analyze",
          },
        },
        required: ["pdf_url"],
      },
    },
    position: { x: 100, y: 100 },
  },
  {
    id: "extractFromFileNode_1",
    type: "extractFromFileNode",
    data: {
      fileUrl: "{{apiTriggerNode_1.pdf_url}}",
      outputKey: "paper_text",
    },
    position: { x: 100, y: 260 },
  },
  {
    id: "LLMNode_1",
    type: "LLMNode",
    data: {
      model: "gpt-4o",
      systemPrompt: "@constitutions/default.md",
      userPrompt: "@prompts/analyze-paper.md",
      variables: {
        paper_text: "{{extractFromFileNode_1.paper_text}}",
      },
      outputSchema: {
        type: "object",
        properties: {
          title: { type: "string" },
          authors: { type: "array", items: { type: "string" } },
          year: { type: ["number", "null"] },
          problem_statement: { type: "string" },
          methodology: { type: "string" },
          key_findings: { type: "array", items: { type: "string" } },
          limitations: { type: "array", items: { type: "string" } },
          plain_english_summary: { type: "string" },
          follow_up_questions: { type: "array", items: { type: "string" } },
        },
        required: [
          "title", "authors", "year", "problem_statement", "methodology",
          "key_findings", "limitations", "plain_english_summary", "follow_up_questions",
        ],
      },
    },
    position: { x: 100, y: 420 },
  },
  {
    id: "apiResponseNode_1",
    type: "apiResponseNode",
    data: {
      output: "{{LLMNode_1.output}}",
    },
    position: { x: 100, y: 580 },
  },
];

export const edges = [
  { id: "e1", source: "apiTriggerNode_1", target: "extractFromFileNode_1" },
  { id: "e2", source: "extractFromFileNode_1", target: "LLMNode_1" },
  { id: "e3", source: "LLMNode_1", target: "apiResponseNode_1" },
];
