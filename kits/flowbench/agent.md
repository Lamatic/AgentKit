# FlowBench

## Overview
FlowBench is an automated testing & benchmarking utility for Lamatic flows. It provides a comprehensive suite to execute test cases, measure latency, score output quality via local embeddings, and compare results against saved baselines. This prevents regressions from reaching production when modifying prompts, switching models, or altering logic.

---

## Purpose
FlowBench is designed as "CI for AI agents" in the pre-deployment lifecycle stage. Unlike tools meant for continuous production monitoring (like `llm-silent-failure-detector`) or interactive single-request debugging (like `live-api-debugger`), FlowBench runs fully automated batch tests across your entire dataset at once. This ensures that a baseline level of correctness and quality is consistently maintained before shipping.

---

## Flows

### flowbench-demo-flow

- **Trigger**
  - Invoked programmatically by the FlowBench runner script or via the Next.js Dashboard.
  - Expected inputs vary based on the specific test cases, but typically involve injecting `userPrompt` or similar arguments into the configured Lamatic flow.

- **What it does**
  1. **Batch Execution:** Reads test cases from a local JSONL file and triggers the configured Lamatic flow for each case concurrently (with timeout mechanisms).
  2. **Latency Tracking:** Measures the exact response time of the flow.
  3. **Quality Scoring:** Uses local embeddings (`Xenova/all-MiniLM-L6-v2` via `@xenova/transformers`) to calculate the semantic similarity between the flow's output and the expected reference string.
  4. **Regression Evaluation:** Compares the current run's metrics against a previously saved baseline JSON file. It specifically filters out normal LLM latency jitter, ensuring only real correctness drops block the run.
  5. **Reporting:** Outputs a detailed pass/fail report, flagging regressions and highlighting improvements directly in the CLI or UI.

- **When to use this flow**
  - Use when deploying major logic changes or prompt updates to your Lamatic flows.
  - Use to establish a correctness baseline before swapping LLM models or altering parameters to ensure no quality degradation.

- **Output**
  - Returns a structured pass/fail analysis and regression report.
  - In CLI mode, it logs a formatted tabular output.
  - In UI mode, it generates an interactive report page at `/report/[runId]`.
  - Saves the baseline metrics to `.flowbench/baselines/` for future regression tracking.

- **Dependencies**
  - Requires a `.env` file with `LAMATIC_API_URL`, `LAMATIC_API_KEY`, and `LAMATIC_PROJECT_ID`.
  - Uses `@xenova/transformers` for local embedding computation without external API dependencies.
