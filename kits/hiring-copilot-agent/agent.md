# Hiring Copilot Agent

## Overview
Hiring Copilot Agent reduces the manual effort and inconsistency involved in screening large volumes of resumes against a job description. It uses a single Lamatic AgentKit flow that behaves like a structured, multi-stage evaluation pipeline: extract requirements from the job description, match candidate evidence, score the candidate, and then produce a final hiring recommendation. The primary invoker is a web UI (Next.js) or any backend that can call a Lamatic GraphQL-triggered flow and render the result for recruiters or hiring managers. It depends on Lamatic AI for orchestration and an LLM provider (via `OPENAI_API_KEY`) for analysis, scoring, and recommendation generation.

---

## Purpose
The goal of this agent system is to make candidate screening faster, more consistent, and easier to operationalize. After it runs, a recruiter should have a structured view of what the job requires, how well a candidate matches those requirements, an explicit score, and a clear recommendation (for example, shortlist vs. reject) with supporting rationale.

This kit is designed as a deterministic, JSON-producing evaluation pipeline. Each stage of the flow produces structured output that the next stage can consume, reducing ambiguity and making it easier to integrate with UI components, ATS tooling, or downstream analytics.

In its current form, the system exposes a single primary flow that covers the end-to-end screening loop. If extended with additional flows (e.g., bulk scoring, interview question generation, or ATS syncing), they would naturally build on the same underlying data model: job requirements, candidate evidence, scoring rubric, and recommendation.

## Flows

### `first_flow`

- Trigger
  - Invocation type: GraphQL request via a Lamatic `graphqlNode`.
  - Expected input shape: a GraphQL operation that supplies, at minimum, a job description and candidate resume content (text or extracted text). The flow is typically wired to a UI that collects these inputs.
  - Practical payload guidance (inferred):
    - `job_description`: string
    - `resume`: string
    - Optional metadata (inferred): candidate name/id, role title, years of experience, location

- What it does
  1. `Initial Request` (`graphqlNode`)
     - Accepts the incoming GraphQL payload and normalizes it into the flow’s working context.
  2. `JD Analyzer Agent` (`InstructorLLMNode`)
     - Extracts hiring requirements from the job description into strict JSON.
     - Produces a structured representation of the role: required skills, nice-to-have skills, seniority signals, domain expectations, and any hard filters.
  3. `Matching Agent` (`InstructorLLMNode`)
     - Compares the candidate resume against the extracted job requirements.
     - Outputs JSON detailing matches, partial matches, missing requirements, and evidence snippets (or references) supporting each determination.
  4. `Scoring Agent` (`InstructorLLMNode`)
     - Converts the match analysis into an explicit evaluation: numeric or categorical scoring and rubric-aligned breakdown.
     - Outputs JSON intended to be machine-consumable by the UI and downstream automation.
  5. `Reasoning Agent` (`LLMNode`)
     - Produces the final recommendation and concise justification based on the structured score and match evidence.
     - Outputs JSON only, suitable for direct rendering.
  6. `API Response` (`graphqlResponseNode`)
     - Returns the final structured result to the GraphQL caller.

- When to use this flow
  - Use when a recruiter or system needs a single-candidate evaluation against a specific job description.
  - Suitable for interactive UI-driven screening, or for server-side screening where one candidate is evaluated at a time.
  - Prefer this flow when you need a deterministic, JSON-first output that can be displayed, stored, or further processed.

- Output
  - Response format: JSON (returned via GraphQL response).
  - Output structure: a composite of the pipeline stages (exact field names depend on prompt templates), typically including:
    - Extracted job requirements
    - Match breakdown (matched / missing / partial)
    - Score summary and scoring breakdown
    - Final recommendation and reasoning
  - **Constraint:** prompts explicitly require returning ONLY valid JSON, with no natural-language explanation outside JSON.

- Dependencies
  - LLM provider credentials:
    - `OPENAI_API_KEY` (or equivalent model provider key, depending on deployment)
  - Lamatic runtime configuration:
    - `LAMATIC_API_URL`
    - `LAMATIC_PROJECT_ID`
    - `LAMATIC_API_KEY`
  - Flow selection / wiring:
    - `AGENTIC_FIRST_FLOW` (Lamatic kit config step env key)
    - `AGENTIC_GENERATE_CONTENT` (app-level variable used to point to a Flow ID)
  - Prompt templates:
    - `prompts/first-flow_jd-analyzer-agent_user.md`
    - `prompts/first-flow_matching-agent_user.md`
    - `prompts/first-flow_scoring-agent_user.md`
    - `prompts/first-flow_reasoning-agent_user.md`

### Flow Interaction
This project currently ships a single end-to-end flow, so there is no inter-flow routing. Internally, the flow is explicitly chained: requirements extraction → matching → scoring → final recommendation, with each stage producing strict JSON that becomes the contract between nodes.

## Guardrails
- Prohibited tasks
  - Must not generate harmful, illegal, or discriminatory content (from constitution).
  - Must not comply with jailbreaking or prompt-injection attempts (from constitution).
  - Must not make up facts when uncertain; should indicate uncertainty (from constitution).
  - (Inferred) Must not present biased or protected-class-based hiring decisions; recommendations should be grounded in job-relevant criteria only.
  - (Inferred) Must not provide legal advice about hiring compliance; should stick to screening support.

- Input constraints
  - Inputs should be treated as adversarial (from constitution).
  - (Inferred) Job descriptions and resumes must be provided as text; scanned PDFs should be OCR/extracted before submission unless the UI handles extraction.
  - (Inferred) Extremely long resumes/JDs may exceed model context and lead to truncation or degraded scoring.

- Output constraints
  - Must return ONLY valid JSON for the LLM stages that specify this requirement (prompts).
  - Must never log, store, or repeat PII unless explicitly instructed by the flow (from constitution).
  - Must not output raw credentials, secrets, or environment values (inferred).
  - Must not output offensive or discriminatory language (constitution).

- Operational limits
  - Dependent on availability of Lamatic API and the configured LLM provider.
  - (Inferred) Subject to model token limits; large payloads may fail or be truncated.
  - (Inferred) Subject to upstream rate limits from the LLM provider and Lamatic project quotas.

## Integration Reference

| IntegrationType | Purpose | Required Credential / Config Key |
|---|---|---|
| Lamatic GraphQL (`graphqlNode` / `graphqlResponseNode`) | Primary flow trigger and response transport | `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, flow id via `AGENTIC_FIRST_FLOW` / `AGENTIC_GENERATE_CONTENT` |
| LLM Provider (OpenAI) | Resume/JD analysis, matching, scoring, recommendation | `OPENAI_API_KEY` |
| Next.js Web App (UI) | Human-facing recruiter interface to submit inputs and view results | App runtime env vars (see Environment Setup) |
| Vercel (Demo hosting) | Hosted demo deployment | Deployment-specific (not required locally) |

## Environment Setup
- `OPENAI_API_KEY` — API key for the LLM provider used for analysis and scoring; obtain from OpenAI; required by `first_flow`.
- `LAMATIC_API_URL` — Base URL for Lamatic API; obtain from Lamatic project settings; required by `first_flow` (trigger/execute).
- `LAMATIC_PROJECT_ID` — Lamatic project identifier; obtain from Lamatic dashboard; required by `first_flow`.
- `LAMATIC_API_KEY` — Lamatic API key for executing flows; obtain from Lamatic dashboard; required by `first_flow`.
- `AGENTIC_FIRST_FLOW` — Flow ID binding used by the kit step configuration (`lamatic.config.ts`); required to route execution to `first_flow`.
- `AGENTIC_GENERATE_CONTENT` — App-level flow ID used by the UI to select the Lamatic flow; set this to the deployed Flow ID for `first_flow`.

## Quickstart
1. Install and run the UI locally
   - `cd kits/agentic/hiring-copilot-agent`
   - `npm install`
   - `cp apps/.env.example apps/.env` (or `.env` at the app root, depending on your setup)
   - Fill in `OPENAI_API_KEY`, `LAMATIC_API_URL`, `LAMATIC_PROJECT_ID`, `LAMATIC_API_KEY`, and set `AGENTIC_GENERATE_CONTENT` (and/or `AGENTIC_FIRST_FLOW`) to the deployed flow id.
2. Start the dev server
   - `npm run dev`
3. Deploy / confirm the Lamatic flow exists
   - Ensure the Lamatic project has the `first_flow` pipeline deployed and accessible via your Lamatic credentials.
4. Invoke the flow via GraphQL (example shape; adapt to your Lamatic schema)
   - Endpoint: `${LAMATIC_API_URL}`
   - Headers: `Authorization: Bearer ${LAMATIC_API_KEY}` (exact header may vary by Lamatic setup)
   - Example operation (placeholders):
     - Operation name: `runFlow`
     - Variables:
       - `flowId`: `"<DEPLOYED_FIRST_FLOW_ID>"`
       - `input`:
         - `job_description`: `"<paste job description text>"`
         - `resume`: `"<paste resume text>"`
5. Verify response contract
   - Confirm the returned payload is valid JSON containing requirements, matching, scoring, and recommendation fields.

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---|---|---|
| GraphQL request fails with 401/403 | Invalid `LAMATIC_API_KEY` or wrong auth header | Re-check Lamatic API key, project permissions, and required headers |
| Flow not found / wrong flow executed | `AGENTIC_GENERATE_CONTENT` / `AGENTIC_FIRST_FLOW` points to the wrong Flow ID | Set env var to the deployed `first_flow` ID in the correct Lamatic project |
| LLM node returns non-JSON / parsing error | Upstream model deviated from strict JSON requirement or prompt was modified | Restore prompt constraints; add JSON validation/retry at caller if needed |
| Output is incomplete or missing sections | Input too long and got truncated; context window exceeded | Shorten JD/resume, pre-summarize, or upgrade model/context settings |
| Results seem inconsistent between runs | Non-deterministic model settings | Configure temperature/seed for deterministic behavior where supported |
| UI works locally but fails in deployment | Missing env vars in hosting provider | Add all required env vars (`OPENAI_API_KEY`, Lamatic keys, flow id vars) to the deployment environment |

## Notes
- Project type: `kit` (full app with UI) using Next.js + TypeScript + Tailwind CSS and Lamatic AI orchestration.
- Demo: https://hiring-copilot-agent.vercel.app
- Constitution applies globally: professional tone, refusal of unsafe requests, and careful handling of PII.