export default {
  name: "flowbench",
  description: "Automated testing & benchmarking tool for Lamatic flows. Run test suites, measure latency, score output quality via local embeddings, and compare against baselines to catch regressions before shipping.",
  version: '1.0.0',
  type: 'kit' as const,
  author: {"name":"Bharath Reddy","email":"bharathreddi18@gmail.com"},
  tags: ["testing","benchmarking","regression"],
  steps: [
    { "id": "flowbench-demo-flow", "type": "mandatory" as const, "envKey": "FLOWBENCH_DEMO_FLOW_ID" }
  ],
  links: {
    "github": "https://github.com/Lamatic/AgentKit/tree/main/kits/flowbench",
    "deploy": "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits/flowbench/apps"
  },
};
