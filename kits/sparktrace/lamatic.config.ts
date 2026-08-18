export default {
  name: "SparkTrace",
  description:
    "Agentic, planner-driven Spark data-pipeline debugging copilot that turns a vague production symptom into a grounded, evidence-backed root-cause report — an Opus planner decides each investigative step, delegating to model-tiered Sonnet/Haiku workers to read the pipeline, generate read-only Athena SQL, and analyze results behind a deterministic safety guard and token-economy compactor.",
  version: "1.1.0",
  type: "kit" as const,
  author: { "name": "Pratyaksh Mundra", "email": "pratyaksh.mundra@gmail.com" },
  tags: ["data-engineering","spark","aws","athena","debugging","agentic"],
  steps: [
    {
        "id": "sparktrace-planner",
        "type": "mandatory",
        "envKey": "SPARKTRACE_PLANNER_FLOW_ID"
    },
    {
        "id": "sparktrace-repo-reader",
        "type": "mandatory",
        "envKey": "SPARKTRACE_REPO_READER_FLOW_ID"
    },
    {
        "id": "sparktrace-query-gen",
        "type": "mandatory",
        "envKey": "SPARKTRACE_QUERY_GEN_FLOW_ID"
    },
    {
        "id": "sparktrace-analyst",
        "type": "mandatory",
        "envKey": "SPARKTRACE_ANALYST_FLOW_ID"
    },
    {
        "id": "sparktrace-reporter",
        "type": "mandatory",
        "envKey": "SPARKTRACE_REPORTER_FLOW_ID"
    }
],
  links: {
    "demo": "https://sparktrace.vercel.app",
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/sparktrace",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fsparktrace%2Fapps",
    "docs": "https://lamatic.ai/templates/agentkits/agentic/agent-kit-sparktrace"
},
};
