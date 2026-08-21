export default {
  name: "PII Ingestion Gate",
  description:
    "A pre-ingestion privacy checkpoint for RAG pipelines. Scan any document for PII, credentials, and confidential data before it is embedded into a vector index — get a severity-scored risk report, an ingestion-safe redacted version with a full audit trail, and a clear safe / needs-redaction / blocked verdict.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Kritensh Kumar", email: "kritensh.kumar@example.com" },
  tags: ["security", "privacy", "rag", "compliance", "guardrails"],
  steps: [
    {
      id: "scan-document",
      type: "mandatory" as const,
      envKey: "SCAN_DOCUMENT_FLOW_ID"
    },
    {
      id: "redact-document",
      type: "mandatory" as const,
      envKey: "REDACT_DOCUMENT_FLOW_ID"
    }
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/pii-ingestion-gate",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fpii-ingestion-gate%2Fapps&env=SCAN_DOCUMENT_FLOW_ID,REDACT_DOCUMENT_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20credentials%20and%20deployed%20flow%20IDs%20are%20required.",
    docs: "https://lamatic.ai/docs"
  }
};
