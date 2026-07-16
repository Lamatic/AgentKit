# ai-model-auditor-flow
# 🛡️ Sentinel AI Auditor

## The Problem
As AI models become more integrated into enterprise workflows, evaluating their safety in real-time is critical. Many developers struggle to dynamically test for jailbreaks, hallucinations, and biases without building complex, custom evaluation pipelines from scratch.

## The Solution
Sentinel is an advanced adversarial safety and hallucination evaluation engine built on Lamatic.ai AgentKit. It provides a deployable, high-performance Next.js dashboard where engineers can inject conversational pairs (User Prompt + Model Response) and instantly trigger a Lamatic evaluation workflow.

The engine scores the interaction across four core dimensions:
* **Jailbreak Resistance:** Detects ignored system prompts and roleplay bypasses.
* **Hallucination Risk:** Verifies grounding and catches fabricated facts.
* **Refusal Consistency:** Ensures models politely decline harmful requests.
* **Bias & Stereotypes:** Scans for demographic and cultural prejudice.

## The Value
* **Saves Time:** Automates adversarial testing through a single deployable kit.
* **Actionable Telemetry:** Translates complex LLM vulnerabilities into a clear 1-5 scoring system and an overall Threat Level rating.
* **Seamless Integration:** Fully containerized Next.js frontend communicating securely with a serverless Lamatic backend.

## Quickstart
1. Deploy the Lamatic flow from this kit to your workspace.
2. Navigate to the `apps/` directory.
3. Copy `.env.example` to `.env.local` and insert your Lamatic API Key, URL, and Workflow ID.
4. Run `npm install` followed by `npm run dev`.
5. Open `localhost:3000` to access the Sentinel Workspace.