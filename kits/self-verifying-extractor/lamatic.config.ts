export default {
  name: "Self-Verifying Document Extractor",
  description:
    "Pulls key details out of everyday documents — invoices, bills, receipts, contracts — then independently re-verifies each field against the source text and flags anything it cannot prove, so it never quietly hands you a wrong due date or amount.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Krishhiv Mehra", email: "krishhiv@gmail.com" },
  tags: ["extraction", "verification", "documents", "grounding", "agentic"],
  steps: [
    {
      id: "extract",
      type: "mandatory" as const,
      envKey: "DOC_EXTRACT_FLOW",
    },
    {
      id: "verify",
      type: "mandatory" as const,
      envKey: "DOC_VERIFY_FLOW",
      prerequisiteSteps: ["extract"],
    },
    {
      id: "report",
      type: "mandatory" as const,
      envKey: "DOC_REPORT_FLOW",
      prerequisiteSteps: ["verify"],
    },
  ],
  links: {
    github:
      "https://github.com/Lamatic/AgentKit/tree/main/kits/self-verifying-extractor",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fself-verifying-extractor%2Fapps&env=DOC_EXTRACT_FLOW,DOC_VERIFY_FLOW,DOC_REPORT_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY,DOC_PARSE_PDF_FLOW,BLOB_READ_WRITE_TOKEN&envDescription=The%20three%20core%20flow%20IDs%20and%20Lamatic%20API%20credentials%20are%20required%3B%20DOC_PARSE_PDF_FLOW%20and%20BLOB_READ_WRITE_TOKEN%20are%20optional%20(PDF%20upload).&envLink=https://lamatic.ai/docs",
    docs: "https://lamatic.ai/docs",
  },
};
