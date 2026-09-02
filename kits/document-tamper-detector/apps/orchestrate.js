// orchestrate.js — Lamatic flow configuration
// This file is imported by both lib/lamatic-client.ts and actions/orchestrate.ts
// It reads env vars at runtime and exposes the config object that the app needs.

export const config = {
  api: {
    endpoint: process.env.LAMATIC_API_URL ?? "",
    projectId: process.env.LAMATIC_PROJECT_ID ?? null,
    apiKey: process.env.LAMATIC_API_KEY ?? "",
  },
  flows: {
    documentTamperDetector: {
      name: "Document Tamper Detector",
      workflowId: process.env.DOCUMENT_TAMPER_DETECTOR_FLOW_ID ?? "",
      inputSchema: {
        fileBase64: "string",
        fileName: "string",
        fileType: "string",
        ocrBoxes: "array",
      },
      outputSchema: {
        trustReport: "object",
      },
    },
  },
};
