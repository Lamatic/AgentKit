export default {
  name: "sre-command-center",
  description:
    "An AI-powered SRE (Site Reliability Engineering) Command Center that simulates, triages, and auto-remediates production incidents. Uses a 3-flow Micro-Flow Architecture: Data Ingestion seeds a Vector DB with runbooks, an Incident Generator creates realistic Datadog-style alerts from natural language prompts, and a Master Responder orchestrates multi-agent triage + RAG retrieval to generate actionable Markdown remediation reports.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Nikhil Rajput", github: "nik-6348" },
  tags: [
    "sre",
    "devops",
    "incident-management",
    "rag",
    "multi-agent",
    "runbook",
    "triage",
    "monitoring",
    "pagerduty",
    "datadog",
  ],
  steps: [
    {
      id: "data_ingestion",
      name: "Initialize Runbook Vector DB",
      description: "Trigger the Data Ingestion flow to chunk and embed your runbooks into Lamatic's Vector DB.",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_INGESTION_ID",
    },
    {
      id: "incident_generator",
      name: "Generate Incident Alert",
      description: "Provide a natural language incident prompt to generate a realistic Datadog-style JSON alert.",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_GENERATOR_ID",
    },
    {
      id: "master_responder",
      name: "Resolve Incident",
      description: "Feed the alert JSON through the Master Responder for automated triage, runbook retrieval, and Markdown report generation.",
      type: "mandatory" as const,
      envKey: "LAMATIC_FLOW_RESPONDER_ID",
    },
  ],
  links: {
    demo: "https://lamatic-sre-command-center.vercel.app/",
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/sre-command-center",
    deploy: "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FLamatic%2FAgentKit&root-directory=kits%2Fsre-command-center%2Fapps",
    video: "https://www.loom.com/share/89656cb630e548039c1c646f91b5f2b8",
  },
};