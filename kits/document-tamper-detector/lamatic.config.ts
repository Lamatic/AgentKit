export default {
  name: "Document Tamper Detector",
  description: "An AI agent that detects signs of digital tampering in uploaded documents (PDF, JPG, PNG) and returns a structured trust report with a risk score, flagged regions, and plain-language explanations.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Taukeer Khan", email: "taukeerkhan1256@gmail.com" },
  tags: ["document", "security", "forensics", "vision", "tamper-detection", "trust"],
  steps: [
    {
      "id": "document-tamper-detector",
      "type": "mandatory" as const,
      "envKey": "DOCUMENT_TAMPER_DETECTOR_FLOW_ID"
    }
  ],
  links: {
    "github": "https://github.com/Taukeer1256/AgentKit/tree/main/kits/document-tamper-detector",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Taukeer1256/AgentKit&root-directory=kits%2Fdocument-tamper-detector%2Fapps&env=DOCUMENT_TAMPER_DETECTOR_FLOW_ID,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Your%20Lamatic%20Document%20Tamper%20Detector%20credentials%20are%20required.&envLink=https://lamatic.ai/docs"
  }
};
