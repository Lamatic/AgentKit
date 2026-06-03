/*
 * # Research Paper Analyzer
 * Accepts a publicly accessible PDF URL, extracts its full text, and returns a
 * structured academic analysis — problem statement, methodology, key findings,
 * limitations, plain-English summary, and follow-up research questions — as JSON.
 *
 * ## Inputs
 * | Field     | Type   | Required | Description                              |
 * |-----------|--------|----------|------------------------------------------|
 * | `pdf_url` | string | Yes      | Publicly accessible URL of the PDF file. |
 *
 * ## Outputs
 * | Field                   | Type     | Description                             |
 * |-------------------------|----------|-----------------------------------------|
 * | `title`                 | string   | Paper title                             |
 * | `authors`               | string[] | Author list                             |
 * | `year`                  | number   | Publication year                        |
 * | `problem_statement`     | string   | Core research problem                   |
 * | `methodology`           | string   | Methods and experimental design         |
 * | `key_findings`          | string[] | Major results                           |
 * | `limitations`           | string[] | Noted limitations                       |
 * | `plain_english_summary` | string   | Lay-audience summary                    |
 * | `follow_up_questions`   | string[] | Suggested follow-up research questions  |
 */

// Flow: research-paper-analyzer

export const meta = {
  name: "Research Paper Analyzer",
  description:
    "Accepts a PDF URL, extracts its text, and returns a structured academic analysis as JSON.",
  tags: ["research", "pdf", "education", "summarization"],
  testInput: { pdf_url: "https://arxiv.org/pdf/1706.03762" },
  author: { name: "Suhas Chowdary", email: "suhaschowdary25@gmail.com" },
};

export const inputs = {};

export const references = {
  prompts: {
    analyze_paper: "@prompts/analyze-paper.md",
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
          "title",
          "authors",
          "year",
          "problem_statement",
          "methodology",
          "key_findings",
          "limitations",
          "plain_english_summary",
          "follow_up_questions",
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

export default { meta, inputs, references, nodes, edges };
