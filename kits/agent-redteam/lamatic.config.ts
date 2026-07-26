export default {
  name: "Agent Red-Team Harness",
  description:
    "Fire a curated jailbreak/prompt-injection/exfiltration attack battery at a system prompt and get a pass/fail guardrail gate before you ship it — a security counterpart to correctness evals.",
  version: "1.0.0",
  type: "kit" as const,
  author: { name: "Ishaan Farooq", email: "ishaanfarooq85@gmail.com" },
  tags: ["security", "evaluation", "testing", "agentic", "guardrails"],
  steps: [
    { id: "judge", type: "mandatory" as const, envKey: "JUDGE_FLOW" },
    { id: "run-target", type: "mandatory" as const, envKey: "RUN_TARGET_FLOW" },
  ],
  links: {
    github: "https://github.com/Lamatic/AgentKit/tree/main/kits/agent-redteam",
    deploy:
      "https://vercel.com/new/clone?repository-url=https://github.com/Lamatic/AgentKit&root-directory=kits%2Fagent-redteam%2Fapps&env=JUDGE_FLOW,RUN_TARGET_FLOW,LAMATIC_API_URL,LAMATIC_PROJECT_ID,LAMATIC_API_KEY&envDescription=Lamatic%20flow%20IDs%20and%20project%20credentials&envLink=https://github.com/Lamatic/AgentKit/tree/main/kits/agent-redteam",
  },
}
