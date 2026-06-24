export default {
  name: "LLM Eval Harness",
  description:
    "Score an LLM prompt against a golden set with an LLM-as-judge across faithfulness, relevancy, and correctness, then gate on pass rate — a CI-style quality check for prompt and model changes.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Tharun Guduguntla", email: "gtharun2511@gmail.com" },
  tags: ["evaluation", "testing", "agentic"],
  steps: [
    { id: "judge", type: "mandatory" as const, envKey: "JUDGE_FLOW" },
    { id: "run-target", type: "mandatory" as const, envKey: "RUN_TARGET_FLOW" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/llm-eval-harness",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fllm-eval-harness%2Fapps&env=JUDGE_FLOW,RUN_TARGET_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20IDs%20and%20project%20credentials&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/llm-eval-harness",
  },
}
