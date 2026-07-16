# ai-model-auditor-flow
# Sentinel AI Auditor

## Overview
Sentinel is a robust, adversarial safety evaluation engine designed to audit Large Language Model (LLM) responses in real-time. It acts as an automated red-teaming assistant that grades conversational pairs across multiple safety dimensions.

## Purpose
As generative AI is deployed into production environments, ensuring safety and alignment is paramount. Sentinel solves the problem of manual output review by providing a structured, immediate evaluation of hallucination risk, jailbreak resistance, bias, and refusal consistency.

## Flows

### `ai-model-auditor-flow`
* **Trigger:** API Request containing a `user_prompt` and `model_response`.
* **Processing:** Routes the conversational pair to a Cohere evaluation model instructed to act as a strict security auditor. It calculates individual dimension scores (1-5), formulates justifications, and calculates a holistic threat level.
* **Response:** A structured JSON object containing the `summary` and granular `dimensions` scoring.
* **When to use:** Use this flow whenever an LLM generates a response that needs to be dynamically vetted for safety before being shown to an end-user.

## Guardrails
* **JSON Strictness:** The agent is strictly prompted to return valid JSON only, bypassing standard conversational pleasantries.
* **Read-Only Evaluation:** The agent evaluates text but does not execute external code or make destructive API calls.
* **Neutrality:** The auditor is instructed to score based strictly on safety and alignment guidelines without applying its own conversational bias.

## Integration Reference
* **Cohere:** Utilizes the Cohere generative model (`command-nightly`) for deep reasoning and adversarial analysis.

## Environment Setup
To run the Sentinel kit, the following environment variables must be configured in your `apps/.env.local` file:
* `LAMATIC_API_KEY`: Sourced from Lamatic Studio Settings -> API Keys.
* `LAMATIC_ENDPOINT_URL`: Sourced from Lamatic Studio -> API Docs.
* `LAMATIC_WORKFLOW_ID`: Sourced from the deployed Flow ID panel.

## Quickstart
1. Clone the repository and navigate to `kits/sentinel-auditor/apps`.
2. Copy `.env.example` to `.env.local` and add your Lamatic credentials.
3. Run `npm install` to install Next.js dependencies.
4. Run `npm run dev` to launch the Sentinel Workspace on `localhost:3000`.
5. Enter a prompt and response pair to trigger the evaluation pipeline.

## Common Failure Modes
| Symptom | Cause | Fix |
|---|---|---|
| API returns 401 Unauthorized | Expired or missing `LAMATIC_API_KEY` | Regenerate key in Lamatic Studio and update `.env.local`. |
| Next.js parsing error | Model hallucinated non-JSON text | Check the raw Lamatic response in the browser console. The frontend includes automatic unwrapping for nested results. |