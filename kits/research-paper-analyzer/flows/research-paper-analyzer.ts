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
            pdf_url: {
              type: "string",
              description: "Publicly accessible URL of the academic PDF to analyze",
            },
          },
          required: ["pdf_url"],
        }),
      },
    },
  },
  {
    id: "fileExtractorNode_1",
    type: "dynamicNode",
    position: { x: 0, y: 160 },
    data: {
      nodeId: "fileExtractorNode",
      values: {
        nodeName: "Extract PDF Text",
        fileUrl: "{{triggerNode_1.output.pdf_url}}",
        outputKey: "paper_text",
      },
    },
  },
  {
    id: "LLMNode_1",
    type: "dynamicNode",
    position: { x: 0, y: 320 },
    data: {
      nodeId: "LLMNode",
      values: {
        nodeName: "Analyze Paper",
        tools: [],
        prompts: [
          {
            id: "analyze-paper-system",
            role: "system",
            content: "@constitutions/default.md",
          },
          {
            id: "analyze-paper-user",
            role: "user",
            content: "@prompts/analyze-paper.md",
          },
        ],
        memories: null,
        messages: null,
        generativeModelName: "gpt-4o",
        outputSchema: JSON.stringify({
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
        }),
      },
    },
  },
  {
    id: "graphqlResponseNode_1",
    type: "dynamicNode",
    position: { x: 0, y: 480 },
    data: {
      nodeId: "graphqlResponseNode",
      values: {
        nodeName: "API Response",
        outputMapping:
          '{\n  "analysis": "{{LLMNode_1.output.generatedResponse}}"\n}',
      },
    },
  },
];

export const edges = [
  {
    id: "triggerNode_1-fileExtractorNode_1",
    source: "triggerNode_1",
    target: "fileExtractorNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "fileExtractorNode_1-LLMNode_1",
    source: "fileExtractorNode_1",
    target: "LLMNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "LLMNode_1-graphqlResponseNode_1",
    source: "LLMNode_1",
    target: "graphqlResponseNode_1",
    sourceHandle: "bottom",
    targetHandle: "top",
    type: "defaultEdge",
  },
  {
    id: "response-graphqlResponseNode_1",
    source: "triggerNode_1",
    target: "graphqlResponseNode_1",
    sourceHandle: "to-response",
    targetHandle: "from-trigger",
    type: "responseEdge",
  },
];

export default { meta, inputs, references, nodes, edges };
